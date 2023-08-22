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

import * as restate from "@restatedev/restate-sdk";

import { protoMetadata } from "./generated/proto/example";
import { OrderSvc } from "./order_service";
import { Notifier } from "./notifier";

restate
  .createServer()
  .bindService({
    service: "OrderService",
    instance: new OrderSvc(),
    descriptor: protoMetadata,
  })
  .bindService({
    service: "NotifierService",
    instance: new Notifier(),
    descriptor: protoMetadata,
  })
  .listen(8080);
