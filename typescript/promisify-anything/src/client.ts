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
  // requests are explicitly idempotent, retry on any error
  retryCondition(error) {
    return error.response?.status != 404 && error.response?.status != 500;
  },
  retryDelay(retryCount, error) {
    const delay = axiosRetry.exponentialDelay(retryCount, error, 100);
    console.log(`Attempt #${retryCount} failed with: ${error}. Backing off for ${Math.round(delay)}ms...`);
    return delay;
  },
  // the timeout set is per request, not for the overall interaction
  shouldResetTimeout: true,
});

const query = async (idempotencyKey: string, query?: string): Promise<AxiosResponse> => {
  const url = "http://localhost:8080/query/query";
  const timeout = 3600_000;
  console.log(`Starting query with idempotency key: ${idempotencyKey} ...`);

  let response = await axios.post(
    url,
    {
      request: query,
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
  const result = await query(process.argv[2] ?? idempotencyKey());
  const rows = result.data.response?.result?.Rows;
  if (rows) console.log(`Response: ${rows[0]?.Data?.[0]?.VarCharValue} = ${rows[1]?.Data?.[0]?.VarCharValue}`);
})();
