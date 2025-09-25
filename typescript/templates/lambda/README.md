# 🚀 Restate + AWS Lambda Template

Welcome to the **Restate TypeScript + AWS Lambda** template! ✨

## 🏁 Getting Started

### Prerequisites
- 📦 Node.js 22+ installed
- 🔧 npm or yarn package manager
- 🌐 AWS account (for deployment)

## 🛠️ Local Development

Launch the local Restate server:
```shell
npx @restatedev/restate-server
```

Start the local endpoint:
```shell
npm run dev
```

Connect your local service to Restate:
```shell
npx @restatedev/restate dep add http://localhost:9080
```

Iterate! 🔧

## 🚀 Deploy

### 📦 On Restate Cloud

This template includes a GitHub Actions workflow setup for automated deployment.

Before setting up the repository, create the AWS Lambda from the AWS console: https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html.
This will make sure all the roles to execute the function are set up. 

To set up the repository, you need to configure your [AWS account for the Github OIDC provider](https://github.com/aws-actions/configure-aws-credentials/tree/main?tab=readme-ov-file#configuring-iam-to-trust-github).

Run:
```shell
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com
```

Then create the role to deploy and set the role ARN as secret `AWS_LAMBDA_ROLE_TO_ASSUME`.

The role should have the following Trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<GITHUB_ORG>/<GITHUB_REPO>:*"
        }
      }
    }
  ]
}
```

And the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LambdaDeployPermissions",
      "Effect": "Allow",
      "Action": [
        "lambda:GetFunctionConfiguration",
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:PublishVersion"
      ],
      "Resource": "arn:aws:lambda:<REGION>:<ACCOUNT_ID>:function:<FUNCTION_NAME>"
    },
    {
      "Sid":"PassRolesDefinition",
      "Effect":"Allow",
      "Action":[
        "iam:PassRole"
      ],
      "Resource":[
        "arn:aws:iam::<ACCOUNT_ID>:role/<FUNCTION_EXECUTION_ROLE>"
      ]
    }
  ]
}
```

For more info, check https://github.com/aws-actions/aws-lambda-deploy?tab=readme-ov-file#credentials-and-region

To perform the Restate registration, you'll need another role, for which you need to configure the arn as secret `AWS_RESTATE_ROLE_TO_ASSUME`.
To set up this role, open the Restate Dashboard at Developers > Security > AWS Lambda.

Finally, you can configure the Restate credentials:

- `RESTATE_AUTH_TOKEN`: Your Restate Cloud auth token. To get one, go to [Developers > API Keys > Create API Key](https://cloud.restate.dev?createApiKey=true&createApiKeyDescription=deployment-key&createApiKeyRole=rst:role::AdminAccess), and make sure to select **Admin** for role
- `RESTATE_ADMIN_URL`: The Admin URL. You can find that out in Developers > Invoke. For example: `https://some-environment-private-id.env.us.restate.cloud:9070`

Once the repo is set up, **just push to the main branch** and you'll get your services updated.

Check the [workflow deploy.yml](.github/workflows/deploy.yml) for more details.

### 🔧 Manual Deployment

You can create a zip ready to deploy on Lambda executing:

```shell
npm run bundle
```

For more info on how to deploy manually, check:

* For cloud: https://docs.restate.dev/cloud/connecting-services
* For on-prem Restate deployments: https://docs.restate.dev/services/deploy/lambda

## 🎯 Next Steps

- 📖 Explore the [Restate documentation](https://docs.restate.dev)
- 🔍 Check out more [examples and tutorials](https://github.com/restatedev/examples)
- 💬 Join the [Restate Discord community](https://discord.gg/skW3AZ6uGd)

Happy building! 🎉