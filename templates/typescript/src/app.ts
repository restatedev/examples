import * as restate from "@restatedev/restate-sdk";

// Template of a Restate handler that simply echos the request.
//
// The Restate context is the entry point of all interaction with Restate, such as
// - RPCs:         `await ctx.rpc<apiType>({ path: "someService" }).doSomething(key, someData)`
// - messaging:    `ctx.send<apiType>({ path: "someService" }).somethingElse(someData)`
// - state:        `await ctx.get<string>("myState")`
// - side-effects: `await ctx.sideEffect(() => { runExternalStuff() })`
// - timers:       `await ctx.sendDelayed<apiType>({ path: "someService" }, 100_000).somethingElse(someData)`
// - etc.
//
// Have a look at the TS docs on the context, or at https://docs.restate.dev/
//

const hello = async (ctx: restate.Context, name: string) => {
  return `Hello ${name}!`;
};

// Create the Restate server to accept requests
restate
  .endpoint()
  .bind(
    restate.service({
      name: "myservice", // the service that serves the handlers
      handlers: { hello },
    })
  )
  .listen(9080);

// --------------
//  Testing this
// --------------
//
// Invoke this by calling Restate to invoke this handler durably:
//
//    curl -X POST -H 'content-type: application/json' http://localhost:8080/myservice/hello -d '"Friend"'
//
// To launch Restate and register this service (if you don't have Restate running already)
//
//  - On macOS:
//    docker run --name restate_dev --rm -p 8080:8080 -p 9070:9070 -p 9071:9071 docker.io/restatedev/restate:latest
//    curl -X POST http://localhost:9070/deployments -H 'content-type: application/json' -d '{"uri": "http://host.docker.internal:9080"}'
//
//  - On Linux:
//    docker run --name restate_dev --rm --network=host docker.io/restatedev/restate:latest
//    curl -X POST http://localhost:9070/deployments -H 'content-type: application/json' -d '{"uri": "http://localhost:9080"}'
