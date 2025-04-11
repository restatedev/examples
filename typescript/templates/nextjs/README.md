# Next.js + Restate Counter Example

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, start the Restate Server:

```shell
restate-server
```

Then, Run the app

```shell
npm i && npm run dev
```

Register Restate services, in `app/restate/[[...services]]/route.ts`:

```shell
restate deployments register http://localhost:3000/restate/v1 --use-http1.1
```

Check out the UI at http://localhost:3000 and increase the counter.

