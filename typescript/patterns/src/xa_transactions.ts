import * as restate from "@restatedev/restate-sdk";
import { randomUUID } from "crypto";

//  -----------------                                         -----------------
//                      Coordinating Database transactions
//  -----------------                                         -----------------

// Restate can be used to be the transaction coordinator for a database
// transaction. The query to the database will be committed exactly once, and can
// thus participate consistently in a sequence of steps in a workflow or durable
// handler execution. 
//
// To do that, we use the 2-phase-commit protocol approach, implemented by many
// databases via the XA transaction standard. For example, PostgreSQL supports this
// via 'prepared transactions': https://www.postgresql.org/docs/current/sql-prepare-transaction.html
//
// Unlike the classical 2-phase-commit scenario, we are not using the protocol to
// commit according to vote 

// In principle, the operation is as simple as
// (1) sideEffect: (execute query, prepare transaction under ID, return ID from sideEffect).
//                 This side effect commits once and a single ID is stored in Restate for
//                 committing.
// (2) sideEffect: commit the prepared transaction
//
// The slightly higher complexity here comes from the fact that we need to ensure that
// any transaction that was prepared, but will not be committed, must be cleaned up by
// the recovery run. Otherwise that transaction will keep holding database locks and
// block other transactions. We also re-try the transaction after that.

// ----------------------------------------------------------------------------

// The methods here must have the same semantics as in the PostgreSQL specification.
// In pacticular the methods:
//  - prepareTxn : https://www.postgresql.org/docs/current/sql-prepare-transaction.html
//  - commitPreparedTxn : https://www.postgresql.org/docs/current/sql-commit-prepared.html
//  - rollbackPreparedTxn : https://www.postgresql.org/docs/current/sql-rollback-prepared.html

export interface Database<QueryT, ResultT> {

    beginTxn(): Promise<void>    // initializes a new transaction
    abortTxn(): Promise<void>    // aborts the current transaction

    runSql(query: QueryT): Promise<ResultT>   // executed a sql statement

    prepareTxn(txnId: string): Promise<void>          // prepared txn for commit under given ID
    commitPreparedTxn(txnId: string): Promise<void>   // commits a txn prepared under given ID
    rollbackPreparedTxn(txnId: string): Promise<void> // rolls back a txn prepared under given ID
}


export async function runXaDatabaseTransaction<QueryT, ResultT>(
        ctx: restate.RpcContext,
        database: Database<QueryT, ResultT>,
        query: QueryT): Promise<ResultT> {

    // we may need multiple attemps, in case of failures
    // whenever we resume in a state where the commit decision hasn't been committed
    // in Restate, we abort whatever may have been started and start over
    while (true) {

        // step 1: generate and store the ID under which the txn will be stored
        //         the Id is stored in Restate's log, so that we can use it during
        //         replay to either commit an accepted transaction, or clean up possibly
        //         prepared txns that we don't want to commit
        let weRunTheQuery = false;
        const txnId = await ctx.sideEffect(() => {
            weRunTheQuery = true;
            return Promise.resolve(randomUUID());
        });

        // step 2: if we actually ran that side effect to generate the txnId, (rather
        //         than replay it) then we execute the query. If we didn't execute that
        //         side effect, then we won't attempt commit that query anyways and will
        //         instead vote to roll it back, so it doesn't matter if the query was
        //         actually never run.
        //         As an optimization, we don't put this into a sideEffect, because it
        //         will anyways never re-execute on replay, because it is conditioned on
        //         the side effect before.
        let queryResult: ResultT | undefined = undefined;
        if (weRunTheQuery) {

            // In this block, cleanup of failures behaves like in any other app as well.
            // for control-flow-style aborts, we abort the transaction. For hard failures,
            // we rely in the DBMS to cancel the txn when the connection closes
            // in case the transaction was already prepared when we failed, the following steps
            // will take care of the cleanup
            try {
                await database.beginTxn();
                queryResult = await database.runSql(query);
                await database.prepareTxn(txnId);
            } catch (e) {
                await database.abortTxn();
                throw e;
            }
        }

        // step 3: we vote whether to abort or to accept the query. Only if we executed the
        //         query before, we'll vote to commit it, otherwise we'll vote to abort it.
        //         That way, we ensure that any recovery/replay for a previous execution that
        //         didn't make it till the vote-to-commit step will make sure the possible query
        //         run gets cleaned up in order to release DB txn locks.
        // type CommittedResult = { commit: boolean, queryResult?: ResultT }

        const commitDecision = await ctx.sideEffect(() =>
                Promise.resolve({ commit: weRunTheQuery, queryResult }));

        if (commitDecision.commit) {
            // now we need to ensure this one gets committed
            await ctx.sideEffect(() => database.commitPreparedTxn(txnId));
            
            // the result could come from a previous execution, in case that execution
            // crashed just after committing (in Restate) the commit decision, but before
            // signalling the database to commit (or returning the result)
            return commitDecision.queryResult!;
        } else {
            // we clean up this query. it might be that this query was never prepared, but
            // that does not matter here
            await ctx.sideEffect(() => database.rollbackPreparedTxn(txnId));
            // fall through the loop and re-try
        }
    }
}
