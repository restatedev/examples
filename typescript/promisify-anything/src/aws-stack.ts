#!/usr/bin/env npx ts-node

import * as cdk from "aws-cdk-lib";
import * as athena from "aws-cdk-lib/aws-athena";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as glue from "@aws-cdk/aws-glue-alpha";
import { Construct } from "constructs";

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

    const workgroup = new athena.CfnWorkGroup(this, "Workgroup", {
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

    const dbAccessRole = new iam.Role(this, "DemoDbAccess", {
      assumedBy: new iam.AccountRootPrincipal(),
    });
    bucket.grantRead(dbAccessRole);
    bucket.grantWrite(dbAccessRole, "data/*");
    bucket.grantWrite(dbAccessRole, "results/*");
    table.grantRead(dbAccessRole);

    dbAccessRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["athena:*", "glue:*", "datalake:*"],
        resources: ["*"],
      }),
    );

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });
    new cdk.CfnOutput(this, "DemoRoleArn", {
      value: dbAccessRole.roleArn,
    });
  }
}

const app = new cdk.App();
new AthenaTableStack(app, "AthenaTableStack");
