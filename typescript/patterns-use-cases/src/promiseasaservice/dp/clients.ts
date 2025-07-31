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
import * as clients from "@restatedev/restate-sdk-clients";

import type { DurablePromise } from "./api";
import type { DurablePromiseObject, DurablePromiseServer, ValueOrError } from "./services";

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
export function durablePromise<T>(promiseId: string, ctx: restate.Context): DurablePromise<T>;

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
export function durablePromise<T>(promiseId: string, ingressUri: string): DurablePromise<T>;

export function durablePromise<T>(
  promiseId: string,
  uriOrCtx: string | restate.Context,
): DurablePromise<T> {
  if (typeof uriOrCtx === "string") {
    return durablePromiseFromIngress(uriOrCtx, promiseId);
  } else {
    return durablePromiseFromContext(uriOrCtx, promiseId);
  }
}

// ----------------------------------- impl ----------------------------------

const DurablePromiseObject: DurablePromiseObject = { name: "promises" };
const DurablePromiseServer: DurablePromiseServer = { name: "promise" };

function durablePromiseFromContext<T>(ctx: restate.Context, promiseId: string): DurablePromise<T> {
  const obj = ctx.objectClient(DurablePromiseObject, promiseId);

  return {
    id: promiseId,

    get: async () => {
      const awk = ctx.awakeable<ValueOrError<T>>();
      await obj.await(awk.id);
      const result = await awk.promise;
      return resultToPromise(result);
    },

    peek: async () => {
      const result = await obj.peek();
      return result === null ? null : resultToPromise(result);
    },

    resolve: async (value?: T) => {
      const result = await obj.resolve(value);
      return resultToPromise(result);
    },

    reject: async (errorMsg: string) => {
      const result = await obj.reject(errorMsg);
      return resultToPromise(result);
    },
  };
}

function durablePromiseFromIngress<T>(restateUri: string, promiseId: string): DurablePromise<T> {
  const restate = clients.connect({ url: restateUri });
  const server = restate.serviceClient(DurablePromiseServer);
  return {
    id: promiseId,

    get: async () => {
      const result = await server.await({ promiseId });
      return resultToPromise(result);
    },

    peek: async () => {
      const result = await server.peek({ promiseId });
      return result ? resultToPromise(result) : null;
    },

    resolve: async (value: T) => {
      const result = await server.resolve({
        promiseId,
        value,
      });

      return resultToPromise(result);
    },

    reject: async (errorMessage: string) => {
      const result = await server.reject({
        promiseId,
        errorMessage,
      });
      return resultToPromise(result);
    },
  };
}

// ----------------------------------- utils ----------------------------------

function resultToPromise<T>(result: ValueOrError<unknown>): Promise<T> {
  return result.error !== undefined
    ? Promise.reject(new Error(result.error))
    : Promise.resolve(result.value as T);
}
