# Hello world - Deno example

Sample project configuration of a Restate service using the TypeScript SDK and
Deno.

Have a look at the [TypeScript Quickstart guide](https://docs.restate.dev/get_started/quickstart?sdk=ts) for more information about the SDK.

You can run locally with `deno task dev` and register to Restate with
`restate dep add http://localhost:9080 --use-http1.1`. `--use-http1.1` is
currently needed with local Deno as we do not support Deno's HTTP2
implementation yet.

You can deploy to Deno Deploy with `deployctl deploy` and register to Restate
with
`restate dep add https://<your-project-subdomain>.deno.dev/`.
