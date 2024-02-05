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

#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LambdaTsCdkStack } from "../lib/lambda-ts-cdk-stack";

const app = new cdk.App();
new LambdaTsCdkStack(app, "LambdaTsCdkStack", {
  selfHosted: Boolean(app.node.tryGetContext("selfHosted")),
  clusterId: app.node.getContext("clusterId"),
  authTokenSecretArn: app.node.getContext("authTokenSecretArn"),
});
