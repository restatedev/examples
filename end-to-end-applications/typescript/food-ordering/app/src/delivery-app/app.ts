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

import {endpoint} from "@restatedev/restate-sdk";
import driverDigitalTwin from "./twin/impl";
import driverDeliveryMatcher from "./matcher/impl";
import deliveryManager from "./delivery_manager/impl";
import driverMobileAppSimulator from "./external/driver_mobile_app_sim";

if (require.main === module) {
      endpoint()
        .bind(driverDigitalTwin)
        .bind(driverDeliveryMatcher)
        .bind(deliveryManager)
        .bind(driverMobileAppSimulator)
        .listen(9081);
}
