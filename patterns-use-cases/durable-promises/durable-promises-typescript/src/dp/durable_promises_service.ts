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
import { DurablePromise, ValueOrError, resultToPromise } from "./durable_promises";

// ----------------------------------------------------------------------------
//           The implementation of the Durable Promises Service
//
//  This service would be deployed and registered to support Durable Promises
//  with Restate. In this version, Durable Promises are an application
//  implemented on top or Restate, showcasing how simple the implementation
//  of such constructs is.
// ----------------------------------------------------------------------------

/**
 * The Virtual Object implementing Durable Promises.
 * 
 * This implements the Durable Promises logic using Restate's state and
 * awakeables. It needs to be added to a deployment to use the durable
 * promises.
 */
export const durablePromiseObject = restate.keyedRouter({

  resolve: <T>(ctx: restate.KeyedContext, _id: string, result: T): Promise<ValueOrError<T>> => {
    const completion = { value: result };
    return completePromise(ctx, completion);
  },

  reject: <T>(ctx: restate.KeyedContext, _id: string, errorMessage: string): Promise<ValueOrError<T>> => {
    const completion = { error: ensureErrorMessage(errorMessage) };
    return completePromise<T>(ctx, completion);
  },

  peek: async <T>(ctx: restate.KeyedContext): Promise<ValueOrError<T> | null> => {
    return ctx.get<ValueOrError<T>>(PROMISE_RESULT_STATE);
  },

  await: async <T>(ctx: restate.KeyedContext, _id: string, awakeableId: string): Promise<ValueOrError<T> | null> => {
    const currVal = await ctx.get<ValueOrError<T>>(PROMISE_RESULT_STATE);

    // case (a), we have a value already
    if (currVal !== null) {
      ctx.resolveAwakeable(awakeableId, currVal);
      return currVal;
    }

    // case (b), we remember the awk Id and get when we have a value
    const listeners = (await ctx.get<string[]>(PROMISE_LISTENER_STATE)) ?? [];
    listeners.push(awakeableId);
    ctx.set(PROMISE_LISTENER_STATE, listeners);
    return null;
  },

  dispose: async (ctx: restate.KeyedContext): Promise<void> => {
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
export function durablePromise<T>(ctx: restate.Context, promiseId: string): DurablePromise<T> {
  return {
    id: () => promiseId,
    get: async () => {
      const awk = ctx.awakeable<ValueOrError<T>>();
      await ctx.rpc(durablePromisesApi).await(promiseId, awk.id);
      const result = await awk.promise;
      return resultToPromise(result);
    },
    peek: async () => {
      const result = await ctx.rpc(durablePromisesApi).peek(promiseId) as ValueOrError<T> | null;
      return result === null ? null : resultToPromise(result);
    },
    resolve: async (value?: T) => {
      const result = await ctx.rpc(durablePromisesApi).resolve(promiseId, value) as ValueOrError<T>;
      return resultToPromise(result);
    },
    reject: async (errorMsg: string) => {
      const result = await ctx.rpc(durablePromisesApi).reject(promiseId, errorMsg) as ValueOrError<T>;
      return resultToPromise(result);
    }
  } satisfies DurablePromise<T>;
}

export const durablePromisePath = "durablePromise"
export const durablePromiseHttpServerPath = "durablePromiseServer"

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

  resolve: (ctx: restate.Context, request: { promiseName: string, value: any }): Promise<ValueOrError<any>> => {
    const name = ensureName(request?.promiseName);
    return ctx.rpc(durablePromisesApi).resolve(name, request?.value);
  },

  reject: (ctx: restate.Context, request: { promiseName: string, errorMessage: string }): Promise<ValueOrError<any>> => {
    const name = ensureName(request?.promiseName);
    const message = ensureErrorMessage(request?.errorMessage);
    return ctx.rpc(durablePromisesApi).reject(name, message);
  },

  peek: (ctx: restate.Context, request: { promiseName: string }): Promise<null | ValueOrError<any>> => {
    const name = ensureName(request?.promiseName);
    return ctx.rpc(durablePromisesApi).peek(name);
  },

  await: async (ctx: restate.Context, request: { promiseName: string }): Promise<ValueOrError<any>> => {
    const name = ensureName(request.promiseName);
    const awakeable = ctx.awakeable<ValueOrError<any>>();
    await ctx.rpc(durablePromisesApi).await(name, awakeable.id);
    return awakeable.promise;
  },

  dispose: (ctx: restate.Context, request: { promiseName: string }): Promise<any> => {
    const name = ensureName(request.promiseName);
    return ctx.rpc(durablePromisesApi).dispose(name);
  }
});

// ----------------------------------------------------------------------------
//                               Utils
// ----------------------------------------------------------------------------

function ensureName(promiseName: string | undefined) : string {
  if (promiseName === undefined) {
      throw new restate.TerminalError("'promiseName' is undefined");
  }
  return promiseName;
}

function ensureErrorMessage(message: string | undefined) : string {
  if (message === undefined) {
      throw new restate.TerminalError("'errorMessage' is undefined");
  }
  return message;
}

async function completePromise<T>(
    ctx: restate.KeyedContext,
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
  listeners.forEach((awkId: string) => ctx.resolveAwakeable(awkId, completion))
  ctx.clear(PROMISE_LISTENER_STATE);
  return completion;
}
