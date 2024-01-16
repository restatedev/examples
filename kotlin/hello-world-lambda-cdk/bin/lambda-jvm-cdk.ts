#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LambdaJvmCdkStack } from "../cdk/lambda-jvm-cdk-stack";

const app = new cdk.App();
new LambdaJvmCdkStack(app, "LambdaJvmCdkStack", {
  selfHosted: Boolean(app.node.tryGetContext("selfHosted")),
  clusterId: app.node.getContext("clusterId"),
  authTokenSecretArn: app.node.getContext("authTokenSecretArn"),
});
