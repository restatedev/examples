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
import {
  NotifierService,
  RestaurantAckRequest,
} from "./generated/proto/example";
import { Empty } from "./generated/proto/google/protobuf/empty";

export class Notifier implements NotifierService {
  async ack(request: RestaurantAckRequest): Promise<Empty> {
    const ctx = restate.useContext(this);

    ctx.completeAwakeable(request.awakeableId, 200);

    return {};
  }
}
