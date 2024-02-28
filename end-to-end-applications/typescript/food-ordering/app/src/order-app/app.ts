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
import * as orderWorkflow from "./order_workflow";
import * as orderstatus from "./order_status_service";

if (require.main === module) {
    restate
        .endpoint()
        .bindKeyedRouter(orderWorkflow.service.path, orderWorkflow.router)
        .bindKeyedRouter(orderstatus.service.path, orderstatus.router)
        .listen(9080);
}
