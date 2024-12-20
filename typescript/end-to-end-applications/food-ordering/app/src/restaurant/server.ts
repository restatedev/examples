/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import express, { Request, Response } from "express";
import axios from "axios";

/**
 * This file contains the logic for the Point of Sales API server of the restaurant.
 * It responds to requests to create, cancel and prepare orders.
 */

const RESTATE_RUNTIME_ENDPOINT =
    process.env.RESTATE_RUNTIME_ENDPOINT || "http://localhost:8080";
const RESTATE_TOKEN = process.env.RESTATE_RUNTIME_TOKEN;

const app = express();
const port = 5050;
app.use(express.json());

app.post("/prepare", (req: Request, res: Response) => {
    const orderId = req.body.orderId
    console.info(
        `${logPrefix()} Started preparation of order ${orderId}; expected duration: 5 seconds`
    );
    res.sendStatus(200);

    setTimeout(async () => {
        console.info(
            `${logPrefix()} Order ${orderId} prepared and ready for shipping`
        );
        await resolveCb(orderId);
    }, 5000);
});

async function resolveCb(orderId: string) {
    await axios.post(
      `${RESTATE_RUNTIME_ENDPOINT}/order-workflow/${orderId}/finishedPreparation`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(RESTATE_TOKEN && { Authorization: `Bearer ${RESTATE_TOKEN}` }),
        },
      }
    );
}

function logPrefix() {
    return `[restaurant] [${new Date().toISOString()}] INFO:`;
}

app.listen(port, () => {
    console.log(`${logPrefix()}  Restaurant is listening on port ${port}`);
});
