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
import * as driverDigitalTwin from "./driver_digital_twin";
import * as driverDeliveryMatcher from "./driver_delivery_matcher";
import * as deliveryManager from "./delivery_manager";
import * as driverMobileAppSimulator from "./external/driver_mobile_app_sim";

if (require.main === module) {
  restate
      .endpoint()
      .bindKeyedRouter(driverDigitalTwin.service.path, driverDigitalTwin.router)
      .bindKeyedRouter(driverDeliveryMatcher.service.path, driverDeliveryMatcher.router)
      .bindKeyedRouter(deliveryManager.service.path, deliveryManager.router)
      .bindKeyedRouter(driverMobileAppSimulator.service.path, driverMobileAppSimulator.router)
      .listen(9081);
}
