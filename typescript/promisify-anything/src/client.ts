/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Tour of Restate Typescript handler API,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/tour-of-restate-typescript
 */

import axios, { AxiosResponse } from "axios";
import axiosRetry from "axios-retry";

axiosRetry(axios, {
  retries: Infinity,
  retryCondition: () => true, // requests are explicitly idempotent, retry on any error
  shouldResetTimeout: true, // the timeout set is per request, not for the overall interaction
  retryDelay: (retryCount, error) => {
    const delay = axiosRetry.exponentialDelay(retryCount, error, 100);
    console.log(`Attempt #${retryCount} failed with ${error}. Backing off for ${delay}ms...`);
    return delay;
  },
});

const query = async (idempotencyKey: string, input: string): Promise<AxiosResponse> => {
  const url = "http://localhost:8080/query/query";
  const timeout = 500; // short .5s timeout to demonstrate retries
  console.log(`Starting query with idempotency key: ${idempotencyKey} ...`);

  let response = await axios.post(
    url,
    {
      request: input,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      timeout,
    },
  );

  console.log(`Query finished with status: ${response.status}.`);
  return response;
};

const idempotencyKey = () => {
  return process.env["IDEMPOTENCY_KEY"] || Math.random().toString(36).substring(2);
};

(async () => {
  const result = await query(idempotencyKey(), "foo");
  console.log({ status: "SUCCESS", result: result.data });
})();
