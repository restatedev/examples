# Hello world - Bun example

Sample project configuration of a Restate service using the TypeScript SDK and
Bun.

Have a look at the [TypeScript Quickstart guide](https://docs.restate.dev/get_started/quickstart?sdk=ts) for more information about this template.

You can run locally with `npm run dev` and register to Restate with
`restate dep add http://localhost:9080 --use-http1.1`. `--use-http1.1` is
always needed with Bun, as it does not yet support HTTP2.
