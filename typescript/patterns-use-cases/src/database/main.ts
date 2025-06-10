import * as restate from "@restatedev/restate-sdk";
import { Sequelize, Transaction } from "sequelize";
import { runQueryAs2pcTxn } from "./2phasecommit";

// ----------------------------------------------------------------------------
//
//  This example shows various patterns to access databases from Restate
//  handlers.
//
//  The basics are:
//
//  (1) You don't need to do anything special, you can just interact with
//      your database the same way as from other microservices or
//      workflow activities.
//
//  (2) But you can use Restate's state, journal, and concurrency mechanisms
//      as helpers to improve common access problems, solve race conditions,
//      or avoid inconsistencies in the presence of retries, concurrent requests,
//      or zombie processes.
//
// The below example illustrate this step by step.
//
// ----------------------------------------------------------------------------

type Row = {
  userId: string; // the primary key
  name: string;
  address: string;
  credits: number;
  version?: number; // the row version (used by some access methods)
};

const db = new Sequelize("postgres://restatedb:restatedb@localhost:5432/exampledb", {
  logging: false,
});

// ----------------------------------------------------------------------------

/**
 * This service implements the database accesses similar to the way you
 * might access the database from other microservices.
 * It doesn't use any Restate features to help making the DB access consistent.
 */
const simpledbAccess = restate.service({
  name: "simple",
  handlers: {
    /**
     * Simple read from a database row.
     * This is the same as it would be from any non-Restate service.
     */
    read: async (_ctx: restate.Context, userid: string) => {
      const [results, _meta] = await db.query(
        `SELECT *
                   FROM users
                  WHERE userid = '${userid}'`
      );
      return results.length > 0 ? results[0] : "(row not found)";
    },

    /**
     * This performs a read in a Restate durable action, persisting the result.
     * The read access is the same as in a non-Restate service, but the result
     * is persisted in the execution journal.
     *
     * This is useful for example, if you have decisions/branches based on
     * the result and want to ensure consistent and deterministic behavior
     * on retries (where the value in the database might have changed
     * in-between retries).
     */
    durableRead: async (ctx: restate.Context, userid: string) => {
      const credits = await ctx.run("read credits", async () => {
        const [results, _metadata] = await db.query(
          `SELECT credits
                       FROM users
                      WHERE userid = '${userid}'`
        );
        return (results[0] as any)?.credits;
      });

      if (credits === 0) {
        // Execute some conditional logic, e.g., alerting, sending reminder.
        // Automatic retries (on failure) will follow this branch again (using
        // Restate's journalled value for 'credits') so code in this branch will
        // reliably run to conclusion
        console.log("Found an account without balance, doing something about it...");
      }

      return credits;
    },

    /**
     * Inserts a row into the database. No Restate-specific handling, this
     * simply uses the database's primary key uniqueness to avoid duplicate
     * entries.
     */
    insert: async (_ctx: restate.Context, row: Row) => {
      const { userId, name, address, credits } = row;

      const [_, numInserted] = await db.query(
        `INSERT INTO users (userid, name, address, credits, version)
                      VALUES ('${userId}', '${name}', '${address}', ${credits}, 0)
                 ON CONFLICT (userid) DO NOTHING`
      );
      return numInserted === 1;
    },

    /**
     * Updates a row in a database. This handler makes no specific effort to
     * add idempotency, so it purely relies on database / application semantics.
     * It is vulnerable to concurrent updates overwriting each other, but can make
     * sense if this is fine for a specific type of (rare) update.
     *
     * For an example that use Restate to add consistency, see the examples
     * further below.
     */
    update: async (_ctx: restate.Context, update: { userId: string; newName: string }) => {
      const { userId, newName } = update;

      // Update row - we execute this statement directly, because it is the only
      // step in this handler. If the handler contains multiple steps, wrap this in
      // a `ctx.run( () => { ... } )` block to ensure it does not get re-executed once
      // during retries of successive steps

      const [_, meta] = await db.query(
        `UPDATE users
                    SET name = '${newName}'
                  WHERE userID = '${userId}'`
      );
      return (meta as any).rowCount === 1;
    },
  },
});

// ----------------------------------------------------------------------------

/*
 * When updating single rows by primary key (on a database or a key/value store),
 * you can use Virtual Objects to serialize access per key. This happens automatically
 * if you access the database from a Virtual Object and use the same key for object and
 * primary key in the database.
 *
 * Most databases internally serialize updates on the same row anyways (either through locks,
 * or by detecting conflicts during when attempting to commit transactions and rolling back), so
 * making the access sequential from the application can help to avoid lock congestion and
 * avoid pathological degradation of optimistic concurrency control around contended keys.
 *
 * Furthermore, this update pattern makes it possible to use conditional updates with versions
 * that don't get duplicated on retries, resulting in proper exactly-once semantics.
 */
const keyedDbAccess = restate.object({
  name: "keyed",
  handlers: {
    /**
     * Updates the credits for a row in a database.
     * This variant makes no effort to ensure the update does not get duplicated.
     *
     * In practice, this will can reasonably safe, because there is a very small window
     * time where the query gets re-executed after success, whihc is when the query succeeded,
     * but Restate did not see the completion of the handler.
     *
     * Note that this is especially rare, since the single-writer-per-key semantics of the
     * Virtual Object ensure that no contention on rows can happen in the database.
     */
    update: async (ctx: restate.ObjectContext, credits: number) => {
      const userid = ctx.key;

      await db.query(
        `UPDATE users
                    SET credits = credits + ${credits}
                  WHERE userid = '${userid}'`
      );
    },

    /**
     * Updates the 'credits' field and uses the 'version' number to make the update
     * idempotent.
     *
     * The approach is to separate reads (current credits, version) and
     * updates into separate queries. The reads are kept in the execution journal, and
     * the updates are conditional on the fact that the version did not change in between.
     * This is sometimes referred to as a _semantic lock pattern_.
     *
     * Because the reads go through a `ctx.run` step (strong consensus inside Restate),
     * it is guaranteed that the same invocation will always work off of the same version.
     * Regardless of partial failures/retries/zombies/network partitions, the code will
     * always observe a single version.
     *
     * If all updates to the row go through this handler (or other handlers in this
     * Virtual Object that use the versioning scheme) then no duplicates are possible.
     */
    updateConditional: async (ctx: restate.ObjectContext, addCredits: number) => {
      const userid = ctx.key;

      // first read the current credits and the version.
      // Because the reads go through a `ctx.run` step (strong consensus), the
      // a single invocation and all if its retries can never see different values
      // for version and credits.
      const [credits, version] = await ctx.run("read credits, version", async () => {
        const [results, _] = await db.query(
          `SELECT credits, version
                       FROM users
                      WHERE userid = '${userid}'`
        );

        if (results.length !== 1) {
          throw new restate.TerminalError(`No single row with userid = '${userid}'`);
        }
        const row = results[0] as any;
        return [Number(row.credits), Number(row.version)];
      });

      // Make the update conditional on the fact that the version is still the same (see
      // 'AND version = ...'). If the version is no longer the same, it means that a
      // previous execution attempt updated this and crashed before completing the handler).
      // It cannot be completed by a concurrent query, because all operations on the userid
      // are serialized through the Virtual Object.
      const [_, meta] = await db.query(
        `UPDATE users
                    SET credits = ${credits + addCredits},
                        version = ${version + 1}
                  WHERE userid = '${userid}'
                    AND version = ${version}`
      );

      if ((meta as any).rowCount !== 1) {
        console.debug("Update was not applied - version no longer matches.");
      }
    },

    /**
     * Reads a row from the database.
     *
     * This one is markes as a SHARED handler, which means it doesn't queue
     * with the other invocations for this key. That way reads execute immediately
     * and concurrently, while writes execute sequentially.
     */
    read: restate.handlers.object.shared(async (ctx: restate.ObjectSharedContext) => {
      const userid = ctx.key;

      const [results, _meta] = await db.query(
        `SELECT *
                       FROM users
                      WHERE userid = '${userid}'`
      );
      return results[0] ?? "(row not found)";
    }),
  },
});

// ----------------------------------------------------------------------------

/**
 * This service uses a second table in the database to remember idempotency tokens
 * for each operation. The idempotency tokens are inserted into the database in the
 * same transaction as the main operation.
 *
 * The code uses Restate's features to deterministically generate the tokens and
 * to expire them after a day.
 */
const idempotencyKeyDbAccess = restate.service({
  name: "idempotency",
  handlers: {
    /**
     * Adds credits to a single user entry. This operation is _idempotent_ within a
     * time window of a day.
     *
     * This handler uses a second table in the database to remember idempotency tokens
     * for each update. The idempotency tokens are inserted into the database in the
     * same transaction as the update.
     *
     * The code uses Restate's features to deterministically generate the tokens and
     * to expire them after a day.
     */
    update: async (ctx: restate.Context, update: { userId: string; addCredits: number }) => {
      // create a persistent idempotency key. we use Restate's random number generator,
      // because that is the most efficient way to generate a durable deterministic ID.
      const idempotencyKey = ctx.rand.uuidv4();

      // expire the idempotency key from the database after one day = 86,400,000ms
      // by scheduling a call to the handler that deletes the key
      ctx
        .serviceSendClient(idempotencyKeyDbAccess, { delay: 86_400_000 })
        .expireIdempotencyKey(idempotencyKey);

      // checking the existence of the idempotency key and making the update happens
      // in one database transaction
      const tx = await db.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      });
      try {
        // first test whether the idempotency token exists by checking whether
        // we can insert one into the table (primary key constraint prevents
        // duplicates)
        const [_tokenRows, numInserted] = await db.query(
          `INSERT INTO user_idempotency (id)
                        VALUES ('${idempotencyKey}')
                    ON CONFLICT (id) DO NOTHING`,
          { transaction: tx }
        );

        if (numInserted !== 1) {
          // idempotency key was inserted before, so this must be a retry
          await tx.rollback();
          return;
        }

        // now make the actual update
        await db.query(
          `UPDATE users
                        SET credits = credits + ${update.addCredits}
                      WHERE userid = '${update.userId}'`,
          { transaction: tx }
        );

        // if everything succeeds, commit idempotency token and update atomically
        await tx.commit();
      } catch (e) {
        // speed up release of DB locks by eagerly aborting transaction
        await tx.rollback();
        throw e;
      }
    },

    /**
     * Deletes the idempotency key from the database.
     * This handler is involked as a scheduled call from the handler that performs
     * the update.
     */
    expireIdempotencyKey: async (_ctx: restate.Context, key: string) => {
      await db.query(
        `DELETE FROM user_idempotency
                       WHERE id = '${key}'`
      );
    },
  },
});

// ----------------------------------------------------------------------------

/**
 * Exactly-once updates to the database using a 2-phase commit integration between
 * Restate and PostegreSQL.
 *
 * This uses PostgreSQL's PREPARE TRANSACTION feature to ensure that Restate
 * kicks off a transaction once and only once, and it thus works without any
 * additional idempotency or versioning mechanisms.
 * BUT: It requires the Postgres database to enable prepared transactions in the
 * configuration via `max_prepared_transactions = 100`.
 *
 * This is a _good use case_ of the 2-phase-commit protocol, because it is not
 * the (rightfully) criticized use case of running distributed transactions across
 * services and thus couple availability and liveliness of multiple services together.
 * This case here keeps the same participants and dependencies and only uses 2pc as a
 * way to split a single-participant transaction into two stages so that Restate can
 * avoid executing the query against the database multiple times under retries.
 *
 * NOTE: This code currently works only on services which have a bidi streaming connection,
 * (so any service deployed as http/2 or http1 bidi) due to the fact that it needs to
 * differentiate re-tries of blocks from first executions, which currently works only
 * for streaming connections. This is simply a missing feature and not a fundamental
 * limitation.
 */
const twoPhaseCommitDbAccess = restate.service({
  name: "twoPhaseCommit",
  handlers: {
    update: async (ctx: restate.Context, update: { userId: string; addCredits: number }) => {
      const { userId, addCredits } = update;

      const query = `UPDATE users
                           SET credits = credits + ${addCredits}
                           WHERE userid = '${userId}'`;

      await runQueryAs2pcTxn(ctx, db, query);
    },
  },
});

// ----------------------------------------------------------------------------

restate
  .endpoint()
  .bind(simpledbAccess)
  .bind(keyedDbAccess)
  .bind(idempotencyKeyDbAccess)
  .bind(twoPhaseCommitDbAccess)
  .listen(9080);
