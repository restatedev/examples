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

export type DurablePromise<T> = {
    get(): Promise<T>,
    peek(): Promise<T | null>,
    resolve(value?: T): Promise<T>,
    reject(errorMsg: string): Promise<T>,
}

export function durablePromise<T>(restateUri: string, promiseId: string): DurablePromise<T> {
  return {
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

  // console.debug(`Making call to Restate at ${url}`);

  const httpResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

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