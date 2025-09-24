# 🚀 Restate + Deno Deploy Template

Welcome to the **Restate TypeScript + Deno Deploy** template! ✨

## 🏁 Getting Started

### Prerequisites
- 📦 Deno runtime installed
- 🔧 npm or yarn package manager
- 🌐 Deno account (for deployment)

## 🛠️ Local Development

Launch the local Restate server:
```bash
npx @restatedev/restate-server
```

Start the Deno server locally:
```bash
deno task dev
```

Connect your local service to Restate:
```bash
npx @restatedev/restate dep add http://localhost:9080
```

Iterate! 🔧

## 🚀 Deploy

### 📦 On Restate Cloud

This template includes a GitHub Actions workflow setup for automated deployment. To set up:

* Create the project going to https://dash.deno.com/new_project linking this repository. Make sure the **project name** matches the one configured in [deploy.yml](.github/workflows/deploy.yml), and check **Just link the repo, I’ll set up GitHub Actions myself**.
* Add the following secrets to the repository:
  - `RESTATE_AUTH_TOKEN`: Your Restate Cloud auth token. To get one, go to Developers > API Keys > Create API Key, and make sure to select **Admin** for role
  - `RESTATE_ADMIN_URL`: The Admin URL. You can find that out in Developers > Invoke. For example: `https://some-environment-private-id.env.us.restate.cloud:9070`

Once the repo is set up, **just push to the main branch** and you'll get your services updated.

Check the [workflow deploy.yml](.github/workflows/deploy.yml) for more details.

> 💡 **Note**: This setup uses [Deno deploy classic](https://docs.deno.com/deploy/classic/). For deno deploy EA, refer to their [documentation](https://docs.deno.com/deploy/early-access/).

### 🔧 Manual Deployment

For more info on how to deploy manually, check:

* For cloud: https://docs.restate.dev/cloud/connecting-services
* For on-prem Restate deployments: https://docs.restate.dev/services/deploy/deno-deploy

## 🎯 Next Steps

- 📖 Explore the [Restate documentation](https://docs.restate.dev)
- 🔍 Check out more [examples and tutorials](https://github.com/restatedev/examples)
- 💬 Join the [Restate Discord community](https://discord.gg/skW3AZ6uGd)

Happy building! 🎉
