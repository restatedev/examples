import * as restate from "@restatedev/restate-sdk";

//  -----------------                                         -----------------
//             Durable Event-based Asynchronous Communication as RPC
//  -----------------                                         -----------------
//
// !!! Durability of communication end-to-end, without having to deal with  !!!
// !!!          message queues and message sending semantics.               !!!
//
// Calling asynchronously via sending events through a persistent message queue,
// is very powerful, because it ensures the call happens regardless of failures
// or temporary unavailability of caller or callee.
//
// Restate makes this a breeze: Its RPC construct is as simple as the req/resp
// RPC that you know. But it is backed by durable event channels, and the durable
// promises and durable execution make sure everything wires up correctly after
// any failure. The ability to suspend when awaiting means that the caller
// doesn't need to stay up while waiting for the callee's response.
//
// Additionally, also RPC calls from external clients to Restate-backed services
// have durability of requests (even when the deployed service/handler is down,
// the call will be delivered once the service comes back), and allow the caller
// to resume / re-connect to invocations.


// Reliably call / re-connect a call via
// 
// curl -X POST http://<restate-runtime>/caller/makeCall \
//      -H 'idempotency-key: ABC'
//      -H 'content-type: application/json'
//      -d '{"request": 12345}'
//
// can reconnect to this invocation by curl-ing with the same idempotency token again.


const caller = {

  makeCall: async (ctx: restate.RpcContext, request: number) => {
    // this call happens asynchronous through a durable message channel
    // and completes reliably despite any caller or callee failure.
    // The caller can even suspend while waiting for the callee to respond.
    const result = await ctx.rpc(calleeApi).beCalled("hello " + request);

    // ...
  }
}

const callee = {
  beCalled: async (ctx: restate.RpcContext, arg: string) => {
    // this will reliably receive the call from 'caller' 
  }
}

const calleeService = restate.router(callee);
const calleeApi = { path: "callee" } as restate.ServiceApi<typeof calleeService>;

const callerService = restate.router(caller);
const callerApi = { path: "caller" } as restate.ServiceApi<typeof callerService>;

restate
    .createServer()
    .bindRouter(calleeApi.path, calleeService)
    .bindRouter(callerApi.path, callerService)
    .listen();
