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

import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as restate from "@restatedev/restate-cdk";
import { Construct } from "constructs";

export class LambdaJvmCdkStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
  ) {
    super(scope, id, props);

    const greeter: lambda.Function = new lambda.Function(this, "RestateKotlin", {
      runtime: lambda.Runtime.JAVA_21,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset("lambda/build/distributions/lambda.zip"),
      handler: "dev.restate.sdk.examples.LambdaHandler",
      timeout: cdk.Duration.seconds(10),
      logFormat: lambda.LogFormat.JSON,
      applicationLogLevel: "DEBUG",
      systemLogLevel: "DEBUG",
    });

    const environment = new restate.SingleNodeRestateDeployment(this, "Restate", {
      // restateImage: "docker.io/restatedev/restate",
      // restateTag: "0.9",
      logGroup: new logs.LogGroup(this, "RestateLogs", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    new iam.Policy(this, "AssumeAnyRolePolicy", {
      statements: [
        new iam.PolicyStatement({
          sid: "AllowAssumeAnyRole",
          actions: ["sts:AssumeRole"],
          resources: ["*"], // we don't know upfront what invoker roles we may be asked to assume at runtime
        }),
      ],
    }).attachToRole(environment.invokerRole);

    const invokerRole = new iam.Role(this, "InvokerRole", {
      assumedBy: new iam.ArnPrincipal(environment.invokerRole.roleArn),
    });
    invokerRole.grantAssumeRole(environment.invokerRole);

    const restateEnvironment = restate.RestateEnvironment.fromAttributes({
      adminUrl: environment.adminUrl,
      invokerRole,
    });

    const deployer = new restate.ServiceDeployer(this, "ServiceDeployer", {
      logGroup: new logs.LogGroup(this, "Deployer", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    deployer.deployService("Greeter", greeter.currentVersion, restateEnvironment, {
      insecure: true, // self-signed certificate
    });

    new cdk.CfnOutput(this, "restateIngressUrl", { value: environment.ingressUrl });
  }
}
