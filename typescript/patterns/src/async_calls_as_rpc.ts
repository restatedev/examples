import * as restate from "@restatedev/restate-sdk";

//  -----------------                                         -----------------
//                   Asynchronous Durable Service Calls as RPC
//  -----------------                                         -----------------
//
// Calling other services is conceptually simplest as request/response RPC.
// But calling asynchronously via sending events through a persistent message queue,
// and then receiving a response via such an event as well, is much more reliable.
// When implementing the event-driven variant correctly, the request and response
// happen regardless of failures or temporary unavailability of either sender or
// receiver. Implementing this is far from trivial, though.
//
// Restate makes this a breeze: Its RPC construct is backed by durable event
// channels, and the durable promises and durable execution make sure everything
// wires up correctly after any failure. The ability to suspend when awaiting
// means that the caller doesn't need to stay up while waiting for the callee's
// response. 

const caller = {
  makeCall: async (ctx: restate.RpcContext, request: number) => {
    const result = await ctx.rpc(calleeApi).beCalled("hello " + request);
    // ...
  }
}

const callee = {
  beCalled: async (ctx: restate.RpcContext, arg: string) => {
    // ...
  }
}

const callerService = restate.router(caller);
const calleeService = restate.router(callee);
const calleeApi = { path: "callee-path" } as restate.ServiceApi<typeof calleeService>;
