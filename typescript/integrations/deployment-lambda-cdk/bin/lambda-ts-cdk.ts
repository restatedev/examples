#!/usr/bin/env node

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

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LambdaTsCdkStack } from "../lib/lambda-ts-cdk-stack";

const app = new cdk.App();
new LambdaTsCdkStack(app, "LambdaTsCdkStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
