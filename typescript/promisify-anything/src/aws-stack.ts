#!/usr/bin/env npx ts-node

import * as cdk from "aws-cdk-lib";
import * as athena from "aws-cdk-lib/aws-athena";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as glue from "@aws-cdk/aws-glue-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as events_targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

class AthenaTableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // We'll use this bucket for both the source data and Athena results output
    const bucket = new s3.Bucket(this, "DataBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const database = new glue.Database(this, "DB", {
      databaseName: "demo_db",
    });

    const table = new glue.S3Table(this, "Table", {
      bucket,
      tableName: "table",
      s3Prefix: "data/",
      database: database,
      columns: [
        { name: "id", type: glue.Schema.STRING },
        { name: "date", type: glue.Schema.DATE },
        { name: "value", type: glue.Schema.DOUBLE },
      ],
      dataFormat: glue.DataFormat.JSON,
    });

    new athena.CfnWorkGroup(this, "Workgroup", {
      name: "demo-workgroup",
      recursiveDeleteOption: true,
      state: "ENABLED",
      workGroupConfiguration: {
        enforceWorkGroupConfiguration: true,
        publishCloudWatchMetricsEnabled: true,
        resultConfiguration: {
          encryptionConfiguration: {
            encryptionOption: "SSE_S3",
          },
          outputLocation: `s3://${bucket.bucketName}/results/`,
        },
      },
    });

    const awakableTable = new dynamodb.Table(this, "AwakablesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dbAccessRole = new iam.Role(this, "DemoDbAccess", {
      assumedBy: new iam.AccountRootPrincipal(),
    });
    bucket.grantRead(dbAccessRole);
    bucket.grantWrite(dbAccessRole, "data/*");
    bucket.grantWrite(dbAccessRole, "results/*");
    table.grantReadWrite(dbAccessRole); // to register the (awakable id, execution id) mapping

    dbAccessRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["athena:*", "glue:*", "datalake:*"],
        resources: ["*"],
      }),
    );

    const athenaResultAwakableAdapter = new NodejsFunction(this, "AwakableAdapter", {
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: "handler",
      entry: "src/eventbridge-awakable-bridge.ts",
      environment: {
        TABLE_NAME: awakableTable.tableName,
        RESTATE_CALLBACK_URL: "http://5.tcp.eu.ngrok.io:17247", //process.env["RESTATE_CALLBACK_URL"]!,
      },
    });
    table.grantReadWrite(athenaResultAwakableAdapter); // to look up the (awakable id, execution id) mapping
    athenaResultAwakableAdapter.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:GetItem"],
        resources: [awakableTable.tableArn],
        effect: iam.Effect.ALLOW,
      }),
    );

    // create EB rule to trigger the lambda when the Athena query state changes
    const rule = new events.Rule(this, "AthenaQueryStateChangeRule", {
      eventPattern: {
        source: ["aws.athena"],
        detailType: ["Athena Query State Change"],
      },
      targets: [new events_targets.LambdaFunction(athenaResultAwakableAdapter)],
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });
    new cdk.CfnOutput(this, "DemoRoleArn", {
      value: dbAccessRole.roleArn,
    });
    new cdk.CfnOutput(this, "AwakableTableName", {
      value: awakableTable.tableName,
    });
  }
}

const app = new cdk.App();
new AthenaTableStack(app, "AthenaTableStack");
