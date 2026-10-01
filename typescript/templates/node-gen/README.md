# Hello world - TypeScript generator SDK example

Sample project configuration of a Restate service using the TypeScript SDK with the generator-based API ([`@restatedev/restate-sdk-gen`](https://www.npmjs.com/package/@restatedev/restate-sdk-gen)).

Have a look at the [TypeScript Quickstart guide](https://docs.restate.dev/get_started/quickstart?sdk=ts) for more information on how to use Restate.

## Requirements

- Node.js 24+
- [pnpm](https://pnpm.io/installation)

## Running

```shell
pnpm install
pnpm dev
```

## Docker

```shell
docker build -t restate-ts-gen-template .
docker run -p 9080:9080 restate-ts-gen-template
```

## Using AI coding tools

If you use Claude Code or Codex, then the Restate plugin will automatically be installed. For Cursor, consult the [skills repo README](https://github.com/restatedev/skills).

Plugin repo: https://github.com/restatedev/skills/tree/main
