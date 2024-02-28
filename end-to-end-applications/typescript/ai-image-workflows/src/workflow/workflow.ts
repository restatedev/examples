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
import * as workflowExecutor from "./workflow_executor";
import * as workflowStatus from "./workflow_status";

restate
    .endpoint()
    .bindRouter(workflowExecutor.service.path, workflowExecutor.router)
    .bindKeyedRouter(workflowStatus.service.path, workflowStatus.router)
    .listen(9080);