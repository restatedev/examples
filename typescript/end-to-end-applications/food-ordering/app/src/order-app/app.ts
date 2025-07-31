/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

import * as restate from "@restatedev/restate-sdk";
import orderWorkflow from "./order_workflow/impl";
import orderStatus from "./order_status/impl";
import driverDigitalTwin from "./driver_digital_twin/impl";
import driverDeliveryMatcher from "./driver_delivery_matcher/impl";
import deliveryManager from "./delivery_manager/impl";
import driverMobileAppSimulator from "./external/driver_mobile_app_sim";

if (require.main === module) {
  restate.serve({
    services: [
      driverDigitalTwin,
      driverDeliveryMatcher,
      deliveryManager,
      driverMobileAppSimulator,
      orderWorkflow,
      orderStatus,
    ],
  });
}
