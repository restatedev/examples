# 🚀 Restate + AWS Lambda Template

Welcome to the **Restate Python + AWS Lambda** template! ✨

## 🏁 Getting Started

### Prerequisites
- 🔧 [`restate` and `restate-server`](https://docs.restate.dev/installation)
- 📦 [`uv`](https://docs.astral.sh/uv/getting-started/installation/)
- 🌐 AWS account (for deployment)

## 🛠️ Local Development

Sync the dependencies using `uv`:
```shell
uv sync
```

Launch the local Restate server:
```shell
restate-server
```

Start the local endpoint:
```shell
uv run uvicorn --port 9080 handler:app
```

Connect your local service to Restate:
```shell
restate dep add http://localhost:9080 --use-http1.1
```

Iterate! 🔧

## 🚀 Deploy

### 📦 On Restate Cloud

This template includes a GitHub Actions workflow setup for automated deployment.

Before setting up the repository, **create the AWS Lambda from the AWS console**: https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html. Then, you'll need two AWS roles to setup:

* The role to **invoke**, to configure in the Github actions secrets as `AWS_INVOKE_ROLE_TO_ASSUME`
* The role to **deploy**, to configure in the Github actions secrets as `AWS_DEPLOY_ROLE_TO_ASSUME`

First, obtain the role to invoke the Lambda. To do so, visit the Restate Dashboard at [Developers > Security > AWS Lambda](https://cloud.restate.dev/to/developers/integration#lambda). When configured, set it up in the Github actions secrets as `AWS_INVOKE_ROLE_TO_ASSUME`.

To set up the repository, you need to configure your [AWS account for the Github OIDC provider](https://github.com/aws-actions/configure-aws-credentials/tree/main?tab=readme-ov-file#configuring-iam-to-trust-github).

Run:
```shell
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com
```

Now you can create the deploy role. The role should have the following Trust policy:

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
        "<AWS_INVOKE_ROLE_TO_ASSUME>"
      ]
    }
  ]
}
```

Once the role is configured, set it up in the Github actions secrets as `AWS_DEPLOY_ROLE_TO_ASSUME`.

For more info, check https://github.com/aws-actions/aws-lambda-deploy?tab=readme-ov-file#credentials-and-region

Finally, add the following to **Github Actions repository secrets**:

- `RESTATE_ADMIN_URL`: The Admin URL. You can find it in [Developers > Admin URL](https://cloud.restate.dev/to/developers/integration#admin)
- `RESTATE_AUTH_TOKEN`: Your Restate Cloud auth token. To get one, go to [Developers > API Keys > Create API Key](https://cloud.restate.dev?createApiKey=true&createApiKeyDescription=deployment-key&createApiKeyRole=rst:role::AdminAccess), and make sure to select **Admin** for role
<img src="https://raw.githubusercontent.com/restatedev/docs-restate/refs/heads/main/docs/img/services/deploy/deployment-token.png" style="width:50%;height:50%;" />

Once the repo is set up, **just push to the main branch** and you'll get your services updated.

Check the [workflow deploy.yml](.github/workflows/deploy.yml) for more details.

### 🔧 Manual Deployment

You can create a zip ready to deploy on Lambda using `uv`, check out the [workflow deploy.yml](.github/workflows/deploy.yml) for more details.

For more info on how to deploy manually, check:

* For cloud: https://docs.restate.dev/cloud/connecting-services
* For on-prem Restate deployments: https://docs.restate.dev/services/deploy/lambda

## 🎯 Next Steps

- 📖 Explore the [Restate documentation](https://docs.restate.dev)
- 🔍 Check out more [examples and tutorials](https://github.com/restatedev/examples)
- 💬 Join the [Restate Discord community](https://discord.gg/skW3AZ6uGd)

Happy building! 🎉