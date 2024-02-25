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

// ----------------------------------------------------------------------------
//           The implementation of the Durable Promises Service
//
//  This is just a simple Virtual Object in Restate that manages the state of
//  the promise and ensures there is a single completor and that listeners
//  will get the notification of the promise result.
// ----------------------------------------------------------------------------

const PROMISE_RESULT_STATE = "value";
const PROMISE_AWAKEABLE_STATE = "listeners";

type ValueOrError<T> = {
  value?: T;
  error?: string;
};

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
    const listeners = (await ctx.get<string[]>(PROMISE_AWAKEABLE_STATE)) ?? [];
    listeners.push(awakeableId);
    ctx.set(PROMISE_AWAKEABLE_STATE, listeners);
    return null;
  },

  dispose: async (ctx: restate.RpcContext): Promise<void> => {
    // fail all pending listeners
    const listeners = (await ctx.get<string[]>(PROMISE_AWAKEABLE_STATE)) ?? [];
    listeners.forEach((awkId: string) => {
      ctx.rejectAwakeable(awkId, "promise was disposed");
    });

    ctx.clear(PROMISE_AWAKEABLE_STATE);
    ctx.clear(PROMISE_RESULT_STATE);
  },
});

export type DurablePromises = typeof durablePromiseObject;

export const durablePromisesApi = { path: "durablePromise" } as restate.ServiceApi<DurablePromises>;

// ----------------------------------------------------------------------------
// This is optionally, just for callers from inside Restate services, to make
// this look like the vanilla JavaScript Promise API.
// ----------------------------------------------------------------------------

export type DurablePromise<T> = Promise<T> & {
    peek(): Promise<T | null>;
    resolve(value?: T): void;
    reject(errorMsg: string): void;
}

export function durablePromise<T>(ctx: restate.RpcContext, name: string): DurablePromise<T> {
    const awk = ctx.awakeable<T>();
    ctx.send(durablePromisesApi).await(name, awk.id);

    // Prepare implementation of DurablePromise
    const peek = (): Promise<T | null> => {
      return ctx.rpc(durablePromisesApi).peek(name) as Promise<T | null>;
    };

    const resolve = (value: T) => {
      ctx.send(durablePromisesApi).resolve(name, value);
    }

    const reject = (errorMsg: string) => {
      ctx.send(durablePromisesApi).reject(name, errorMsg);
    }

    return Object.defineProperties(awk.promise, {
      peek: { value: peek },
      resolve: { value: resolve },
      fail: { value: reject },
    }) as DurablePromise<T>;
  }


// ----------------------------------------------------------------------------
//                               Utils
// ----------------------------------------------------------------------------

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
  const listeners = (await ctx.get<string[]>(PROMISE_AWAKEABLE_STATE)) ?? [];
  if (completion.error !== undefined) {
    const msg = completion.error;
    listeners.forEach((awkId: string) => ctx.rejectAwakeable(awkId, msg))
  } else {
    listeners.forEach((awkId: string) => ctx.resolveAwakeable(awkId, completion.value))
  }
  ctx.clear(PROMISE_AWAKEABLE_STATE);
  return completion;
}

function resultToPromise<T>(result: ValueOrError<unknown>): Promise<T> {
  return result.error !== undefined
    ? Promise.reject(new Error(result.error))
    : Promise.resolve(result.value as T);
}

function ensureErrorMessage(message: string | undefined) : string {
  if (message === undefined) {
      throw new restate.TerminalError("error message is undefined");
  }
  return message;
}

// ----------------------------------------------------------------------------
//                               BACKUP
// Mostly NodeJS serialization quirks to support bigint and Error types. 
// ----------------------------------------------------------------------------

function serializeResult(result: ValueOrError<unknown>): string {
  return JSON.stringify(result, replacer);
}

function replacer(key: string, value: any) {
  // handle objects that have a toJSON method
  if (value !== undefined &&
    value !== null &&
    typeof value.toJSON == "function"
  ) {
    return value.toJSON(key) as any;
  }
  // handle bigInts
  if (typeof value === "bigint") {
    return "BIGINT::" + value.toString();
  }
  // handle errors
  if (value instanceof Error) {
      const stringifiedError = stringifyError(value);
      return { stringifiedError };
  }
  return value;
}

function stringifyError(error: Error): string {
  const errorProps = error as { [key: string]: any };
  const obj: { [key: string]: any } = {};

  Object.getOwnPropertyNames(errorProps).forEach((key) => {
    if (typeof key === "string") {
      obj[key] = errorProps[key];
    }
  })

  return JSON.stringify(obj, replacer);
}

function deserializeResult(serialized: string): ValueOrError<unknown> {
  return JSON.parse(serialized, reviver);
}

function reviver(key: string, value: any) {
  // handle bigInts
  if (typeof value === "string" && value.startsWith("BIGINT::")) {
    return BigInt(value.substring(8));
  }
  // handle errors
  if (value?.stringifiedError && typeof value.stringifiedError === "string") {
    return errorFromJson(value.stringifiedError);
  }
  return value;
}


function errorFromJson(jsonString: string): Error {
  const obj = JSON.parse(jsonString, reviver);
  const error = new Error(obj.message);

  Object.keys(obj).forEach((key) => {
      (error as { [key: string]: any })[key] = obj[key];
  });
  return error;
}
