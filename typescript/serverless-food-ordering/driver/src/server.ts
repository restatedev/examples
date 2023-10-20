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

import axios from "axios";

const RESTATE_RUNTIME_ENDPOINT = process.env.RESTATE_RUNTIME_ENDPOINT || "http://localhost:9090";
const RESTATE_TOKEN = process.env.RESTATE_RUNTIME_TOKEN;
const REQUEST_BASE_URL = RESTATE_RUNTIME_ENDPOINT + "/driver/";

const driverId = "driver-phil";
const region = "San Jose (CA)"


async function makeCall(functionName: string, requestBody: any) {
  makeKeyedCall(functionName, undefined, requestBody);
}

async function makeKeyedCall(functionName: string, key: string | undefined, requestBody: any) {

  await axios.post(
    REQUEST_BASE_URL + functionName,
    {key, request: requestBody},
    {
      headers: {
        "Content-Type": "application/json",
        ...(RESTATE_TOKEN && { Authorization: `Bearer ${RESTATE_TOKEN}` }),
      },
    }
  );

}

async function ready() {
  makeKeyedCall("driverAvailable", driverId, region);
}

let location x = 

while (true) {
  // driver is ready for work
  ready();

}



const app = express();
const port = 5050;
app.use(express.json());

app.post("/create", (req: Request, res: Response) => {
  console.info(`${logPrefix()} Creating order ${req.body.orderId}`);
  res.sendStatus(200);

  setTimeout(async () => {
    console.info(`${logPrefix()}  Order ${req.body.orderId} accepted`);
    console.info(`${logPrefix()}  Order ${req.body.orderId} created`);
    await resolveCb(req.body.cb, true);
  }, 50);
});

app.post("/prepare", (req: Request, res: Response) => {
  console.info(
    `${logPrefix()}  Started preparation of order ${
      req.body.orderId
    }; expected duration: 5 seconds`
  );
  res.sendStatus(200);

  setTimeout(async () => {
    console.info(
      `${logPrefix()}  Order ${
        req.body.orderId
      } prepared and ready for shipping`
    );
    await resolveCb(req.body.cb);
  }, 5000);
});

app.post("/cancel", (req: Request, res: Response) => {
  console.info(`${logPrefix()}  Cancelling order ${req.body.orderId}`);
  res.sendStatus(200);

  setTimeout(async () => {
    console.info(`${logPrefix}  Order ${req.body.orderId} cancelled`);
    await resolveCb(req.body.cb);
  }, 50);
});

async function resolveCb(cb: string, payload?: boolean) {
  await axios.post(
    `${RESTATE_RUNTIME_ENDPOINT}/dev.restate.Awakeables/Resolve`,
    { id: cb, json_result: payload ?? {} },
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
