# Hello world - Cloudflare workers + Typescript example

Sample project configuration of a Restate service using the TypeScript SDK and
Cloudflare Workers.

Have a look at the [TypeScript Quickstart guide](https://docs.restate.dev/get_started/quickstart?sdk=ts) for more information about this template.

You can run locally with `npm run dev` and register to Restate with
`restate dep add http://localhost:9080 --use-http1.1`. `--use-http1.1` is needed
with the local Workers dev server, as it does not expose HTTP2.

You can deploy to cloudflare with `npm run deploy` and register to Restate with
`restate dep add https://restate-cloudflare-worker.<your-subdomain>.workers.dev`.
