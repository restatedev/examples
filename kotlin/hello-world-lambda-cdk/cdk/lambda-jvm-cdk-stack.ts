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

    const restateInstance = new restate.RestateCloudEndpoint(this, "RestateCloud", {
      clusterId: props.clusterId,
      authTokenSecretArn: props.authTokenSecretArn,
    });

    // Alternatively, you can deploy Restate on your own infrastructure like this. See the Restate CDK docs for more.
    // const restateInstance = new restate.SingleNodeRestateInstance(this, "Restate", {
    //   logGroup: new logs.LogGroup(this, "RestateLogs", {
    //     retention: logs.RetentionDays.THREE_MONTHS,
    //   }),
    // });

    const handlers = new restate.LambdaServiceRegistry(this, "RestateServices", {
      serviceHandlers: {
        "greeter.Greeter": greeter,
      },
      restate: restateInstance,
    });
    handlers.register({
      metaEndpoint: restateInstance.metaEndpoint,
      invokerRoleArn: restateInstance.invokerRole.roleArn,
      authTokenSecretArn: restateInstance.authToken.secretArn,
    });

    new cdk.CfnOutput(this, "HandlerFunction", {
      value: greeter.functionName,
    });
  }
}
