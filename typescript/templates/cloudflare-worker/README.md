# 🚀 Restate + Cloudflare Workers Template

Welcome to the **Restate TypeScript + Cloudflare Workers** template! ✨

## 🏁 Getting Started

### Prerequisites
- 📦 Node.js 20+ installed
- 🔧 npm or yarn package manager
- 🌐 Cloudflare account (for deployment)

## 🛠️ Local Development

Launch the local Restate server:
```bash
npx @restatedev/restate-server
```

Start the Cloudflare Workers development server:
```bash
npm run dev
```

Connect your local service to Restate:
```bash
npx @restatedev/restate dep add http://localhost:9080 --use-http1.1
```

> 💡 **Note**: The `--use-http1.1` flag is required **only** when running locally.

Iterate! 🔧

## 🚀 Deploy

### 📦 On Restate Cloud

This template includes a GitHub Actions workflow setup for automated deployment.

To set up the repository, add the following to **Github Actions repository secrets**:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token. To get a token, check https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- `RESTATE_ADMIN_URL`: The Admin URL. You can find it in [Developers > Admin URL](https://cloud.restate.dev/to/developers/integration#admin)
- `RESTATE_AUTH_TOKEN`: Your Restate Cloud auth token. To get one, go to [Developers > API Keys > Create API Key](https://cloud.restate.dev?createApiKey=true&createApiKeyDescription=deployment-key&createApiKeyRole=rst:role::AdminAccess), and make sure to select **Admin** for role
<img src="https://raw.githubusercontent.com/restatedev/docs-restate/refs/heads/main/docs/img/services/deploy/deployment-token.png" style="width:50%;height:50%;" />

Once the repo is set up, **just push to the main branch** and you'll get your services updated.

Check the [workflow deploy.yml](.github/workflows/deploy.yml) for more details.

### 🔧 Manual Deployment

For more info on how to deploy manually, check:

* For cloud: https://docs.restate.dev/cloud/connecting-services
* For on-prem Restate deployments: https://docs.restate.dev/services/deploy/cloudflare-workers

## 🎯 Next Steps

- 🔐 Secure your endpoint as shown in your [Restate Cloud Dashboard > Developers > Security](https://cloud.restate.dev/to/developers/integration#security)
- 📖 Explore the [Restate documentation](https://docs.restate.dev)
- 🔍 Check out more [examples and tutorials](https://github.com/restatedev/examples)
- 💬 Join the [Restate Discord community](https://discord.gg/skW3AZ6uGd)

Happy building! 🎉
