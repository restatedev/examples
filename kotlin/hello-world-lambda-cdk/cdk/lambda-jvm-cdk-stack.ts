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
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as restate from "@restatedev/restate-cdk";
import { Construct } from "constructs";

export class LambdaJvmCdkStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: {
      clusterId: string;
      authTokenSecretArn: string;
    } & cdk.StackProps,
  ) {
    super(scope, id, props);

    const greeter: lambda.Function = new lambda.Function(this, "RestateKotlin", {
      runtime: lambda.Runtime.JAVA_21,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset("lambda/build/libs/lambda-all.jar"),
      handler: "dev.restate.sdk.examples.LambdaHandler",
      timeout: cdk.Duration.seconds(10),
      logFormat: lambda.LogFormat.JSON,
      applicationLogLevel: "DEBUG",
      systemLogLevel: "DEBUG",
    });

    const environment = new restate.RestateCloudEnvironment(this, "RestateCloud", {
      clusterId: props.clusterId,
      authTokenSecretArn: props.authTokenSecretArn,
    });

    // Alternatively, you can deploy Restate on your own infrastructure like this. See the Restate CDK docs for more.
    // const environment = new restate.SingleNodeRestateInstance(this, "Restate", {
    //   logGroup: new logs.LogGroup(this, "RestateLogs", {
    //     retention: logs.RetentionDays.THREE_MONTHS,
    //   }),
    // });

    new restate.LambdaServiceRegistry(this, "RestateServices", {
      handlers: {
        "greeter.Greeter": greeter,
      },
      environment,
    });
  }
}
