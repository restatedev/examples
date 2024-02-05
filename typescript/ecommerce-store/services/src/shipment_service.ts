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

import * as restate from "@restatedev/restate-sdk";
import {
  PrepareShipmentRequest,
  PrepareShipmentResponse,
  ShipmentService,
} from "./generated/proto/shoppingcart";
import { v4 as uuid } from "uuid";

export class ShipmentSvc implements ShipmentService {
  async prepareShipment(
    _request: PrepareShipmentRequest
  ): Promise<PrepareShipmentResponse> {
    const ctx = restate.useContext(this);

    const trackingId = await ctx.sideEffect(async () => uuid());

    const shipmentData = "09/09/2029";

    return PrepareShipmentResponse.create({
      success: true,
      trackingNumber: trackingId,
      shipmentDate: shipmentData,
      shipmentCost: 0,
    });
  }
}
