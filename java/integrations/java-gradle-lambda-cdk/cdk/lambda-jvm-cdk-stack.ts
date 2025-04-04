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

import * as restate from "@restatedev/restate-cdk";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class LambdaJvmCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const handler: lambda.Function = new lambda.Function(this, "GreeterService", {
      runtime: lambda.Runtime.JAVA_21,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset("lambda/build/distributions/lambda.zip"),
      handler: "my.example.LambdaHandler",
      timeout: cdk.Duration.seconds(10),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
    });

    // Set the RESTATE_ENV_ID and RESTATE_API_KEY environment variables to point to your Restate Cloud environment.
    // This construct automatically creates an invoker role that Restate Cloud will be able to assume to invoke handlers
    // on behalf of your environment. See https://docs.restate.dev/deploy/cloud for more information.
    const restateEnvironment = new restate.RestateCloudEnvironment(this, "RestateCloud", {
      environmentId: process.env.RESTATE_ENV_ID! as restate.EnvironmentId,
      // Warning: this will result in the API key being baked into the CloudFormation template!
      // For improved security, pre-populate the secret and pass it to the construct as a reference.
      // See: https://docs.aws.amazon.com/secretsmanager/latest/userguide/cdk.html
      apiKey: new secrets.Secret(this, "RestateCloudApiKey", {
        secretStringValue: cdk.SecretValue.unsafePlainText(process.env.RESTATE_API_KEY!),
      }),
    });
    const deployer = new restate.ServiceDeployer(this, "ServiceDeployer");

    // Alternatively, you can deploy a standalone Restate server using the SingleNodeRestateDeployment construct.
    // Please see https://docs.restate.dev/deploy/lambda/self-hosted and the construct documentation for more details.
    // const vpc = ec2.Vpc.fromLookup(this, "Vpc", { vpcId: "..." });
    // const restateEnvironment = new restate.SingleNodeRestateDeployment(this, "Restate", {
    //   vpc,
    //   networkConfiguration: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    // });
    // const deployer = new restate.ServiceDeployer(this, "ServiceDeployer", {
    //   vpc,
    //   securityGroups: [restateEnvironment.adminSecurityGroup],
    // });

    deployer.deployService("Greeter", handler.currentVersion, restateEnvironment);
    new cdk.CfnOutput(this, "restateIngressUrl", { value: restateEnvironment.ingressUrl });
  }
}
