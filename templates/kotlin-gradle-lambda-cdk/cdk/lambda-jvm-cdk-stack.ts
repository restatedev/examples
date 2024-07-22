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
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
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

    // This role is used by Restate to invoke Lambda service handlers; see https://docs.restate.dev/deploy/cloud for
    // information on deploying services to Restate Cloud environments. For standalone environments, the EC2 instance
    // profile can be used directly instead of creating a separate role.
    const invokerRole = new iam.Role(this, "InvokerRole", {
      assumedBy: new iam.AccountRootPrincipal(), // set up trust such that your Restate environment can assume this role
    });

    // You can reference an existing Restate environment you manage yourself or a Restate Cloud environment by
    // configuring its address and optionally auth token. The deployer will use these settings to register the handlers.
    const restateEnvironment = restate.RestateEnvironment.fromAttributes({
      adminUrl: "https://restate.example.com:9070", // pre-existing Restate server address not managed by this stack
      invokerRole,
    });

    // Alternatively, you can deploy a standalone Restate server using the RestateServer construct. Please refer to
    // https://docs.restate.dev/deploy/lambda/self-hosted and the construct documentation for details.
    // const restateEnvironment = new restate.SingleNodeRestateDeployment(this, "Restate", {
    //   logGroup: new logs.LogGroup(this, "RestateLogs", {
    //     logGroupName: "/restate/server-logs",
    //     retention: logs.RetentionDays.ONE_MONTH,
    //   }),
    // });

    const deployer = new restate.ServiceDeployer(this, "ServiceDeployer", {
      logGroup: new logs.LogGroup(this, "Deployer", {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // The environment's invoker role will be granted appropriate invoke permissions automatically.
    // To use CDK hotswap deployments during development, deploy `latestVersion` instead.
    deployer.deployService("Greeter", greeter.currentVersion, restateEnvironment, {
      // insecure: true, // accept self-signed certificate for SingleNodeRestateDeployment
    });

    // If deploying a standalone Restate server, we can output the ingress URL like this.
    // new cdk.CfnOutput(this, "restateIngressUrl", { value: restateEnvironment.ingressUrl });
  }
}
