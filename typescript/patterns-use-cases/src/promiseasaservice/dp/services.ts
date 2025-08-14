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

/**
 * Internal type to represent a result.
 */
export type ValueOrError<T> = {
  value?: T;
  error?: string;
};

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
export const durablePromiseObject = restate.object({
  name: "promises",
  handlers: {
    resolve: <T>(ctx: restate.ObjectContext, result: T): Promise<ValueOrError<T>> => {
      const completion = { value: result };
      return completePromise(ctx, completion);
    },

    reject: <T>(ctx: restate.ObjectContext, errorMessage: string): Promise<ValueOrError<T>> => {
      const completion = { error: ensureErrorMessage(errorMessage) };
      return completePromise<T>(ctx, completion);
    },

    peek: async <T>(ctx: restate.ObjectContext): Promise<ValueOrError<T> | null> => {
      return ctx.get<ValueOrError<T>>(PROMISE_RESULT_STATE);
    },

    await: async <T>(
      ctx: restate.ObjectContext,
      awakeableId: string,
    ): Promise<ValueOrError<T> | null> => {
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

    dispose: async (ctx: restate.ObjectContext): Promise<void> => {
      // fail all pending listeners
      const listeners = (await ctx.get<string[]>(PROMISE_LISTENER_STATE)) ?? [];
      listeners.forEach((awkId: string) => {
        ctx.rejectAwakeable(awkId, "promise was disposed");
      });

      ctx.clear(PROMISE_LISTENER_STATE);
      ctx.clear(PROMISE_RESULT_STATE);
    },
  },
});

export type DurablePromiseObject = typeof durablePromiseObject;

const PROMISE_RESULT_STATE = "value";
const PROMISE_LISTENER_STATE = "listeners";

// ----------------------------------------------------------------------------
// To expose Durable Promises externally through the HTTP endpoint, we need
// a separate service to handle the awakeable logic for subscribers.
// Otherwise this just forwards calls.
//
// This will become obsolete in future versions with API updates on the
// Virtual Objects.
// ----------------------------------------------------------------------------

const DurablePromiseObject: DurablePromiseObject = { name: "promises" };

export const durablePromiseServer = restate.service({
  name: "promise",
  handlers: {
    resolve: (
      ctx: restate.Context,
      request: { promiseId: string; value: any },
    ): Promise<ValueOrError<any>> => {
      const name = ensureName(request?.promiseId);
      const obj = ctx.objectClient(DurablePromiseObject, name);
      return obj.resolve(request?.value);
    },

    reject: (
      ctx: restate.Context,
      request: { promiseId: string; errorMessage: string },
    ): Promise<ValueOrError<any>> => {
      const name = ensureName(request?.promiseId);
      const message = ensureErrorMessage(request?.errorMessage);
      const obj = ctx.objectClient(DurablePromiseObject, name);
      return obj.reject(message);
    },

    peek: (
      ctx: restate.Context,
      request: { promiseId: string },
    ): Promise<null | ValueOrError<any>> => {
      const name = ensureName(request?.promiseId);
      const obj = ctx.objectClient(DurablePromiseObject, name);
      return obj.peek();
    },

    await: async (
      ctx: restate.Context,
      request: { promiseId: string },
    ): Promise<ValueOrError<any>> => {
      const name = ensureName(request.promiseId);
      const awakeable = ctx.awakeable<ValueOrError<any>>();
      const obj = ctx.objectClient(DurablePromiseObject, name);
      await obj.await(awakeable.id);
      return awakeable.promise;
    },

    dispose: (ctx: restate.Context, request: { promiseId: string }): Promise<any> => {
      const name = ensureName(request.promiseId);
      const obj = ctx.objectClient(DurablePromiseObject, name);
      return obj.dispose();
    },
  },
});

export type DurablePromiseServer = typeof durablePromiseServer;

// ----------------------------------------------------------------------------
//                               Utils
// ----------------------------------------------------------------------------

function ensureName(promiseId: string | undefined): string {
  if (promiseId === undefined) {
    throw new restate.TerminalError("'promiseId' is undefined");
  }
  return promiseId;
}

function ensureErrorMessage(message: string | undefined): string {
  if (message === undefined) {
    throw new restate.TerminalError("'errorMessage' is undefined");
  }
  return message;
}

async function completePromise<T>(
  ctx: restate.ObjectContext,
  completion: ValueOrError<T>,
): Promise<ValueOrError<T>> {
  const prevResult = await ctx.get<ValueOrError<T>>(PROMISE_RESULT_STATE);

  // already completed - return the previous result
  if (prevResult !== null) {
    return prevResult;
  }

  // first completor
  ctx.set(PROMISE_RESULT_STATE, completion);

  //  notify awaiting awakeables
  const listeners = (await ctx.get<string[]>(PROMISE_LISTENER_STATE)) ?? [];
  listeners.forEach((awkId: string) => ctx.resolveAwakeable(awkId, completion));
  ctx.clear(PROMISE_LISTENER_STATE);
  return completion;
}
