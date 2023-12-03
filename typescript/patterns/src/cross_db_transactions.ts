import * as restate from "@restatedev/restate-sdk";
import * as restate_db_txn from "./xa_transactions";

//  -----------------                                         -----------------
//                          Cross-Database transactions 
//  -----------------                                         -----------------

// Building on top of the "Coordinating Database transactions" pattern, you
// can use Restate to be a coordinator transactions across databases, if those
// expose an XA-transactions-like interface.
//
// Note that this is not a classical distributed 2-phase-commit transaction that
// requires all databases to answer before being able to commit anything, but
// a workflow that will always run to completion and ensure all changes will
// made and committed. The advantage of that is less blocking time for each
// database, which is one of the major downsides of distributed 2-phase-commit
// transactions.

// replace those stubs with the proper database drivers 
const database1 = { } as restate_db_txn.Database<string, any>;
const database2 = { } as restate_db_txn.Database<string, any>;

type WireTransaction = {
  widthdrawalQuery: string,
  depositQuery: string
}

async function wireTransaction(ctx: restate.RpcContext, txn: WireTransaction) {

  const result = await restate_db_txn.runXaDatabaseTransaction(ctx, database1, txn.widthdrawalQuery);

  if (result.success) {
    await restate_db_txn.runXaDatabaseTransaction(ctx, database2, txn.depositQuery);
  }
}
