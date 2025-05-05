/*
 * Copyright (c) 2025 - Restate Software, Inc., Restate GmbH
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
import * as path from "path";

export class LambdaPythonStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const handler = new lambda.Function(this, "GreeterService", {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "handler.app",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda"), {
        bundling: {
          image: lambda.Runtime.PYTHON_3_13.bundlingImage,
          command: [
            'bash', '-c', [
              'pip install -r requirements.txt -t /asset-output',
              'cp -r . /asset-output',
            ].join(' && ')
          ],
        },
      }),
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(30),
    });

    // If you would prefer to manually register the Lambda service with your Restate environment,
    // you can remove or comment the rest of the code below this line.
    if (!process.env.RESTATE_ENV_ID || !process.env.RESTATE_API_KEY) {
      throw new Error(
        "Required environment variables RESTATE_ENV_ID and RESTATE_API_KEY are not set, please see README."
      );
    }

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

    deployer.deployService("Greeter", handler.latestVersion, restateEnvironment);
    new cdk.CfnOutput(this, "restateIngressUrl", { value: restateEnvironment.ingressUrl });
  }
}
