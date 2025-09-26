# 🚀 Restate + Vercel Template

Welcome to the **Restate TypeScript + Vercel** template! ✨

## 🏁 Getting Started

### Prerequisites
- 📦 Node runtime installed
- 🔧 npm or yarn package manager
- 🌐 Vercel account (for deployment)

## 🛠️ Local Development

Launch the local Restate server:
```bash
npx @restatedev/restate-server
```

Start Next.js locally:
```bash
npm run dev
```

Connect your local service to Restate:
```bash
npx @restatedev/restate dep add http://localhost:9080
```

Iterate! 🔧

## 🚀 Deploy

### 📦 On Restate Cloud

This template includes a GitHub Actions workflow setup for automated deployment. To set up:

* Create the project importing this repository: https://vercel.com/new
* Disable [Vercel Authentication](https://vercel.com/docs/security/deployment-protection/methods-to-protect-deployments/vercel-authentication) for the project.
![Screenshot of Vercel authentication](https://raw.githubusercontent.com/restatedev/docs-restate/refs/heads/main/docs/img/services/deploy/vercel-disable-authentication.png)
* Add the following to **Github Actions repository secrets**:
  - `RESTATE_ADMIN_URL`: The Admin URL. You can find that out in Developers > Invoke. For example: `https://some-environment-private-id.env.us.restate.cloud:9070`
  - `RESTATE_AUTH_TOKEN`: Your Restate Cloud auth token. To get one, go to [Developers > API Keys > Create API Key](https://cloud.restate.dev?createApiKey=true&createApiKeyDescription=deployment-key&createApiKeyRole=rst:role::AdminAccess), and make sure to select **Admin** for role
<img src="https://raw.githubusercontent.com/restatedev/docs-restate/refs/heads/main/docs/img/services/deploy/deployment-token.png" style="width:50%;height:50%;" />

Once the repo is set up, **just push to the main branch**, Vercel will deploy and promote the `main` branch, and the action configured in [deploy.yml](.github/workflows/deploy.yml) will automatically register the deployment to Restate.

### 🔧 Manual Deployment

For more info on how to deploy manually, check:

* For cloud: https://docs.restate.dev/cloud/connecting-services
* For on-prem Restate deployments: https://docs.restate.dev/services/deploy

## 🎯 Next Steps

- 🔐 Secure your endpoint as shown in your [Restate Cloud Dashboard > Developers > Security](https://cloud.restate.dev/to/developers/integration#security)
- 📖 Explore the [Restate documentation](https://docs.restate.dev)
- 🔍 Check out more [examples and tutorials](https://github.com/restatedev/examples)
- 💬 Join the [Restate Discord community](https://discord.gg/skW3AZ6uGd)

Happy building! 🎉
