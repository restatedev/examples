/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
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
  process.env.RESTATE_RUNTIME_ENDPOINT || "http://localhost:9090";

const app = express();
const port = 5050;
app.use(express.json());

app.post("/create", (req: Request, res: Response) => {
  console.info(`Creating order ${req.body.orderId
    } in point of sales software of restaurant.
    Order summary:
        ${JSON.stringify(req.body.order)}`);
  res.sendStatus(200);
});

app.post("/cancel", (req: Request, res: Response) => {
  console.info(`Canceling order ${req.body.orderId} in point of sales software of restaurant.`);
  res.sendStatus(200);
});

app.post("/prepare", (req: Request, res: Response) => {
  console.info(`Scheduling order ${req.body.orderId} for preparation in point of sales software of restaurant...
    Preparing order ${req.body.orderId}...
    Expected duration: 5 seconds`);
  res.sendStatus(200);

  // Send back a success message to the awakeable to signal that the food got prepared
  setTimeout(() => {
    console.info(
      `Order ${req.body.orderId} prepared and ready for shipping...`
    );
    axios.post(
      `${RESTATE_RUNTIME_ENDPOINT}/ordering.NotifierService/Ack`,
      { awakeableId: "" + req.body.awakeableId },
      { headers: { "Content-Type": "application/json" } }
    );
  }, 5000);
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
