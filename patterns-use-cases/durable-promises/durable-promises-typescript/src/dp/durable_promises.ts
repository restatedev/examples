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

// ----------------------------------------------------------------------------
//               Interfaces and Types for the Durable Promises 
// ----------------------------------------------------------------------------

/**
 * The core durable promise type.
 */
export type DurablePromise<T> = {
    /** The ID of the durable promise. */
    id(): string,

    /** A JS promises that represents the durable promise.
     * Will complete when the durable promise completes */
    get(): Promise<T>,

    /** A JS promises that represents the current value, and return 'null'
     * if the durable promise is not yet complete. */
    peek(): Promise<T | null>,

    /** Resolves the durable promise. The returned promise resolves to the
     * actual value of the promise, which can be different if the promise was
     * completed before by some other request. */
    resolve(value?: T): Promise<T>,

    /** Rejects the durable promise with an error message (not an actual Error, due
     * to the footguns in serializing Errors across processes).
     * The returned promise resolves to the actual value of the promise, which can
     * be different if the promise was completed before by some other request. */
    reject(errorMsg: string): Promise<T>,
}

/**
 * Creates a durable promise with the given name. The promise is stored/tracked by
 * the Restate instance at the given URI.
 */
export function durablePromise<T>(restateUri: string, promiseId: string): DurablePromise<T> {
  return {
    id: () => promiseId,
    get: async () => {
      const result: ValueOrError<T> = await makeRestateCall(restateUri, "await", promiseId, {});
      return resultToPromise(result);
    },
    peek: async () => {
      const result: undefined | null | ValueOrError<T> = await makeRestateCall(restateUri, "peek", promiseId, {});
      return result ? resultToPromise(result): null;
    },
    resolve: async (value: T) => {
      const result: ValueOrError<T> = await makeRestateCall(restateUri, "resolve", promiseId, { value });
      return resultToPromise(result);
    },
    reject: async (errorMessage: string) => {
      const result: ValueOrError<T> = await makeRestateCall(restateUri, "reject", promiseId, { errorMessage });
      return resultToPromise(result);
    }
  } satisfies DurablePromise<T>
}

/**
 * Internal type to represent a result.
 */
export type ValueOrError<T> = {
  value?: T;
  error?: string;
};

// ----------------------------------- utils ----------------------------------

export function resultToPromise<T>(result: ValueOrError<unknown>): Promise<T> {
  return result.error !== undefined
    ? Promise.reject(new Error(result.error))
    : Promise.resolve(result.value as T);
}

async function makeRestateCall<R, T>(
  restateUri: string,
  method: string,
  promiseName: string,
  params: T
): Promise<R> {
  checkParameter("restateUri", restateUri);
  checkParameter("method", method);
  checkParameter("promiseName", promiseName);

  if (!(restateUri.startsWith("http://") || restateUri.startsWith("https://"))) {
    throw new Error("Invalid Restate URI: You need a protocol prefix ('http://' or 'https://')");
  }

  const url = `${restateUri}/durablePromiseServer/${method}`;
  const data = {
    request: {
      promiseName,
      ...params,
    }
  };

  let body: string;
  try {
    body = JSON.stringify(data);
  } catch (err) {
    throw new Error("Cannot encode request: " + err, { cause: err });
  }

  let httpResponse;
  try {
      httpResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
  } catch (err: any) {
    throw new Error(
      `Could not contact Restate server at ${restateUri}: ${err.message}`,
      { cause: err })
  }

  const responseText = await httpResponse.text();
  if (!httpResponse.ok) {
    throw new Error(`Request failed: ${httpResponse.status}\n${responseText}`);
  }

  let response;
  try {
    response = JSON.parse(responseText);
  } catch (err) {
    throw new Error("Cannot parse response JSON: " + err, { cause: err });
  }

  if (response.error) {
    throw new Error(response.error);
  }
  if (response.response) {
    return response.response as R;
  }
  if (Object.keys(response).length === 0) {
    return undefined as R;
  }

  throw new Error("Unrecognized response object: " + responseText);
}

function checkParameter(name: string, param: any) {
  if (param === undefined || typeof param !== "string") {
    throw new Error(`string parameter ${name} is missing`);
  }
}