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
      runtime: lambda.Runtime.JAVA_11,
      code: lambda.Code.fromAsset("lambda/build/libs/lambda-all.jar"),
      handler: "dev.restate.sdk.examples.LambdaHandler",
      timeout: cdk.Duration.seconds(10),
    });

    const restateInstance = new restate.RestateCloudEndpoint(this, "RestateCloud", {
      clusterId: props.clusterId,
      authTokenSecretArn: props.authTokenSecretArn,
    });

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
  }
}
