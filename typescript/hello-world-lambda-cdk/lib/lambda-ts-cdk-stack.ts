import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as restate from "@restatedev/restate-cdk";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class LambdaTsCdkStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: (
      | { selfHosted: true }
      | {
          selfHosted: false;
          clusterId: string;
          authTokenSecretArn: string;
        }
    ) &
      cdk.StackProps,
  ) {
    super(scope, id, props);

    const greeter: lambda.Function = new NodejsFunction(this, "GreeterService", {
      runtime: lambda.Runtime.NODEJS_LATEST,
      entry: "lib/lambda/handler.ts",
      architecture: lambda.Architecture.ARM_64,
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    const environment = props.selfHosted
      ? new restate.SingleNodeRestateDeployment(this, "Restate", {
          logGroup: new logs.LogGroup(this, "RestateLogs", {
            retention: logs.RetentionDays.THREE_MONTHS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        })
      : new restate.RestateCloudEnvironment(this, "RestateCloud", {
          clusterId: props.clusterId,
          authTokenSecretArn: props.authTokenSecretArn,
        });

    new restate.LambdaServiceRegistry(this, "ServiceRegistry", {
      environment,
      handlers: {
        Greeter: greeter,
      },
    });
  }
}
