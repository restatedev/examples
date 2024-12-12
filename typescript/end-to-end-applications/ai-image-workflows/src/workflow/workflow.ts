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
    .bind(workflowExecutor.service)
    .bind(workflowStatus.service)
    .listen(9080);