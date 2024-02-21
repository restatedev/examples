/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

import * as restate from "@restatedev/restate-sdk";

//  -----------------                                         -----------------
//                         Dual Writes (or Multi-writes)
//  -----------------                                         -----------------
//
// Dual writes (or multi-writes) happen any time a request attempts to update
// multiple other systems. This has a bunch of challenges, including making sure
// all the requests happen consistently in the presence of failures.
//
// Restate helps here, because
//  - handler invocations are retried to make them run to the end
//  - the durable execution journal deduplicates completed actions on retry
//  - RPC has exactly-once semantics between Restate services

async function applyChange(ctx: restate.RpcContext, request: UpdateRequest) {
  
  // write 1: Update the database. This sideEffect will be automatically retried
  //          upon failure. Once succeeded and recorded as succeeded in Restate
  //          it will not get re-executed on failover/recovery.
  // alternatively, use a XA transaction here, see 'xa_transactions.ts'
  await ctx.sideEffect(() => db.update(request.dbUpdateRecord));

  // write 2: send a message
  ctx.send(messageSenderApi).publish(request.kafkaMessage);
  
  // write 3: set some Restate state
  ctx.set("status", request); 
};

// ----------------------------------------------------------------------------
//  To avoid complex dependencies, we put a minimal API mock here

type UpdateRequest = {
  dbUpdateRecord: any,
  kafkaMessage: any
}

const db = {
  update: async (update: UpdateRequest) => {}
}

const messageSender = restate.router({ publish: async (ctx: restate.RpcContext, message: any) => {}});
const messageSenderApi = { path: "kafkaProducer" } as restate.ServiceApi<typeof messageSender>;
