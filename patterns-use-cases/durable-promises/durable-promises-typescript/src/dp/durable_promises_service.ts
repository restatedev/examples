/*
 * Copyright (c) 2023-2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate SDK for Node.js/TypeScript,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in file LICENSE in the root
 * directory of this repository or package, or at
 * https://github.com/restatedev/sdk-typescript/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import { durablePromise as durablePromiseExt, DurablePromise } from "./durable_promises";

// ----------------------------------------------------------------------------
//           The implementation of the Durable Promises Service
//
//  This service would be deployed and registered to support Durable Promises
//  with Restate. In this version, Durable Promises are an application
//  implemented on top or Restate, showcasing how simple the implementation
//  of such constructs is.
// ----------------------------------------------------------------------------

const PORT = Number(process.env.PORT || 9087);

/**
 * The Virtual Object implementing Durable Promises.
 * 
 * This implements the Durable Promises logic using Restate's state and
 * awakeables. It needs to be added to a deployment to use the durable
 * promises.
 */
export const durablePromiseObject = restate.keyedRouter({

  resolve: async <T>(
    ctx: restate.RpcContext,
    _promiseName: string,
    result: T
  ): Promise<T> => {
    const completion = { value: result };
    const promiseResult = await completePromise(ctx, completion);
    return resultToPromise(promiseResult);
  },

  reject: async <T>(
    ctx: restate.RpcContext,
    _promiseName: string,
    errorMessage: string
  ): Promise<T> => {
    const completion = { error: ensureErrorMessage(errorMessage) };
    const promiseResult = await completePromise<T>(ctx, completion);
    return resultToPromise(promiseResult);
  },

  peek: async <T>(ctx: restate.RpcContext): Promise<T | null> => {
    const currentValue = await ctx.get<ValueOrError<T>>(PROMISE_RESULT_STATE);
    return currentValue === null ? Promise.resolve(null) : resultToPromise(currentValue);
  },

  await: async <T>(
    ctx: restate.RpcContext,
    _promiseName: string,
    awakeableId: string
  ): Promise<T | null> => {

    const currVal = await ctx.get<ValueOrError<T>>(PROMISE_RESULT_STATE);

    // case (a), we have a value already
    if (currVal !== null) {
      if (currVal.error !== undefined) {
        ctx.rejectAwakeable(awakeableId, currVal.error);
      } else {
        ctx.resolveAwakeable(awakeableId, currVal.value);
      }
      return resultToPromise(currVal);
    }

    // case (b), we remember the awk Id and get when we have a value
    const listeners = (await ctx.get<string[]>(PROMISE_LISTENER_STATE)) ?? [];
    listeners.push(awakeableId);
    ctx.set(PROMISE_LISTENER_STATE, listeners);
    return null;
  },

  dispose: async (ctx: restate.RpcContext): Promise<void> => {
    // fail all pending listeners
    const listeners = (await ctx.get<string[]>(PROMISE_LISTENER_STATE)) ?? [];
    listeners.forEach((awkId: string) => {
      ctx.rejectAwakeable(awkId, "promise was disposed");
    });

    ctx.clear(PROMISE_LISTENER_STATE);
    ctx.clear(PROMISE_RESULT_STATE);
  },
});

/**
 * Create a durable promise that uses the Restate Context to interact
 * with the promise server.
 * 
 * All promise interactions automatically partake in the durable execution
 * without any need to track them as side effects.
 * 
 * To use the durable promises without a Restate Context (from any process), use
 * the {@link durablePromiseExt durablePromise} function instead.
 */
export function durablePromise<T>(ctx: restate.RpcContext, promiseId: string): DurablePromise<T> {
  return {
    get: async () => {
      const awk = ctx.awakeable<T>();
      await ctx.rpc(durablePromisesApi).await(promiseId, awk.id);
      return awk.promise;
    },
    peek: () => ctx.rpc(durablePromisesApi).peek(promiseId) as Promise<T | null>,
    resolve: (value?: T) => ctx.rpc(durablePromisesApi).resolve(promiseId, value) as Promise<T>,
    reject: (errorMsg: string) => ctx.rpc(durablePromisesApi).reject(promiseId, errorMsg) as Promise<T>,
  } satisfies DurablePromise<T>;
}

export const durablePromisePath = "durablePromise"
export const durablePromiseHttpServerPath = "durablePromiseServer"

type ValueOrError<T> = {
  value?: T;
  error?: string;
};

const PROMISE_RESULT_STATE = "value";
const PROMISE_LISTENER_STATE = "listeners";

const durablePromisesApi = { path: durablePromisePath } as restate.ServiceApi<typeof durablePromiseObject>;

// ----------------------------------------------------------------------------
// To expose Durable Promises externally through the HTTP endpoint, we need
// a separate router to handle the awakeable logic for subscribers.
// Otherwise this just forwards calls.
// 
// This will become obsolete in future versions with API updates on the
// Virtual Objects.
// ----------------------------------------------------------------------------

export const durablePromiseServer = restate.router({

  resolve: (ctx: restate.RpcContext, request: { promiseName: string, value: any }): Promise<any> => {
    const name = ensureName(request?.promiseName);
    return ctx.rpc(durablePromisesApi).resolve(name, request?.value);
  },

  reject: (ctx: restate.RpcContext, request: { promiseName: string, errorMessage: string }): Promise<any> => {
    const name = ensureName(request?.promiseName);
    const message = ensureErrorMessage(request?.errorMessage);
    return ctx.rpc(durablePromisesApi).reject(name, message);
  },

  peek: (ctx: restate.RpcContext, request: { promiseName: string }): Promise<any> => {
    const name = ensureName(request?.promiseName);
    return ctx.rpc(durablePromisesApi).peek(name);
  },

  await: async (ctx: restate.RpcContext, request: { promiseName: string }): Promise<any> => {
    const name = ensureName(request.promiseName);
    const awakeable = ctx.awakeable();
    await ctx.rpc(durablePromisesApi).await(name, awakeable.id);
    return awakeable.promise;
  },

  dispose: (ctx: restate.RpcContext, request: { promiseName: string }): Promise<any> => {
    const name = ensureName(request.promiseName);
    return ctx.rpc(durablePromisesApi).dispose(name);
  }
});

// launch the server, if this is our main entry point
if (require.main === module) {
  restate.createServer()
    .bindKeyedRouter(durablePromisePath, durablePromiseObject)
    .bindRouter(durablePromiseHttpServerPath, durablePromiseServer)
    .listen(PORT);
}

// ----------------------------------------------------------------------------
//                               Utils
// ----------------------------------------------------------------------------

function ensureName(promiseName: string | undefined) : string {
  if (promiseName === undefined) {
      throw new restate.TerminalError("promise name is undefined");
  }
  return promiseName;
}

function ensureErrorMessage(message: string | undefined) : string {
  if (message === undefined) {
      throw new restate.TerminalError("error message is undefined");
  }
  return message;
}

function resultToPromise<T>(result: ValueOrError<unknown>): Promise<T> {
  return result.error !== undefined
    ? Promise.reject(new Error(result.error))
    : Promise.resolve(result.value as T);
}

async function completePromise<T>(
    ctx: restate.RpcContext,
    completion: ValueOrError<T>): Promise<ValueOrError<T>> {
  const prevResult = await ctx.get<ValueOrError<T>>(PROMISE_RESULT_STATE);

  // already completed - return the previous result
  if (prevResult !== null) {
    return prevResult;
  }

  // first completor
  ctx.set(PROMISE_RESULT_STATE, completion);

  //  notify awaiting awakeables
  const listeners = (await ctx.get<string[]>(PROMISE_LISTENER_STATE)) ?? [];
  if (completion.error !== undefined) {
    const msg = completion.error;
    listeners.forEach((awkId: string) => ctx.rejectAwakeable(awkId, msg))
  } else {
    listeners.forEach((awkId: string) => ctx.resolveAwakeable(awkId, completion.value))
  }
  ctx.clear(PROMISE_LISTENER_STATE);
  return completion;
}
