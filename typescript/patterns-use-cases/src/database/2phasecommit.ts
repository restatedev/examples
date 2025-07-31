import * as restate from "@restatedev/restate-sdk";
import { randomUUID } from "node:crypto";
import { Sequelize, Transaction } from "sequelize";

/**
 * Example 2-phase-commit integration library for Restate and PostegreSQL.
 *
 * This uses PostgreSQL's PREPARE TRANSACTION feature to ensure that Restate
 * kicks off a transaction once and only once.
 *
 * Postgres' interface is far from optimal here, for example it does not provide a way
 * to block/fence off discarded transaction IDs or establish other relationship between
 * transaction IDs. As a result, this code is needs to be very aggressive in cleaning
 * up previous transactions, to avoid leaving database locks in place.
 *
 * This code currently works only on services which have a bidi streaming connection !!!
 */
export async function runQueryAs2pcTxn(
  ctx: restate.Context,
  dbConnection: Sequelize,
  query: string,
) {
  const action = async (db: Sequelize, txn: Transaction) => {
    await db.query(query, { transaction: txn });
  };
  return runAs2pcTxn(ctx, dbConnection, action);
}

/**
 * See docs for {@link runQueryAs2pcTxn}.
 *
 * IMPORTANT: When using function, all queries issues must make use of the `tnx` object:
 * ```
 * await db.query(
 *     "UDATE ... SET ... WHERE ...",
 *     { transaction: txn }
 * );
 * ```
 */
export async function runAs2pcTxn(
  ctx: restate.Context,
  dbConnection: Sequelize,
  action: (dbConnection: Sequelize, txn: Transaction) => Promise<void>,
) {
  // this code only works on a streaming bi-directional connection, see below.
  checkRunsOnBidi(ctx);

  // We loop here until we are are sure that there successfully made it through
  // (1) running DB transaction, (2) preparing for commit (pre-commit), (3) recording
  // that in the Restate journal.
  // If we don't make it through the full squence in one execution attempt, we clear the
  // pending transaction and try again under a different transaction ID. Successive re-tries
  // and recoveries from failures also make sure they clean up the pending transaction.
  // In the absence of failures, the first iteration will succeed.
  let txnIdToCommit: string | undefined = undefined;
  while (txnIdToCommit === undefined) {
    // We generate the transaction ID and use a trick here to find out if we
    // actually generated the ID, or whether the ID was restored from the journal.
    // That is the reason this code only works on long-lived bidi connections (not Lambda),
    // because on Lambda, every `ctx.run` block is only ack-ed through a re-invocation
    // and journal replay.
    let executedThisTime: boolean = false;
    const txnId: string = await ctx.run("generate transaction id", () => {
      executedThisTime = true;
      return randomUUID();
    });

    // this is our cleanup hook for this specific transaction ID, to run in case
    // we need to ensure the transaction is cleared
    async function cleanup() {
      try {
        await dbConnection.query(`ROLLBACK PREPARED '${txnId}'`);
      } catch (e: any) {
        if (e.original?.code === "42704" && e instanceof Error) {
          // code 42704 means "no txn with that ID found".
          // => transaction was not prepared (crashed before) or already rolled back
          // => we can ignore this
          return;
        }
        console.error(e.message);
        throw e;
      }
    }

    try {
      const txnRan = await ctx.run("run txn attempt (or cleanup old txn)", async () => {
        // If we did not generate this transaction ID, a previous execution attempt did.
        // We don't know whether that execution made it to the point that it already prepared
        // the query (pre-committed) and crashed just before recording the completion of the
        // `ctx.run` block in the Restate journal. As a result, we clean up that transaction ID
        // to be on the safe side and not leave lingering database locks.
        if (!executedThisTime) {
          cleanup();
          return false; // try again with a different txnId
        }

        // run:
        //   (1) the query transaction
        //   (2) pre-commit step (prepare transaction)
        //   (3) record this in the Restate journal

        const txn = await dbConnection.transaction();
        try {
          // (1) run the main app-defined database query (or queries)
          await action(dbConnection, txn);

          // (2) pre-commit - after this step, the txn is immutable and not rolled back
          // any more after closing/disposing/loss-of-connection
          await dbConnection.query(`PREPARE TRANSACTION '${txnId}'`, {
            transaction: txn,
          });
          // (3) if this durable block returns ('true' recoded in journal) step (3) will
          // be completed
          return true;
        } catch (e) {
          await txn.rollback();
          throw e;
        }
      });

      if (txnRan) {
        txnIdToCommit = txnId;
      }
    } catch (e) {
      // clean up in case the query didn't go through, to speed up release
      // of possibly prepared txn
      await cleanup();
      throw e;
    }
  }

  // now commit the prepared transaction - this step is idempotent, so if it was
  // already committed, this does nothing
  await ctx.run("commit prepared transaction", () =>
    dbConnection.query(`COMMIT PREPARED '${txnIdToCommit}'`),
  );
}

function checkRunsOnBidi(ctx: restate.Context): boolean {
  // this needs to be replaced by the actual check, which needs an additional
  // property to be exposed in Restate
  return true; // dummy value for now
}
