# Deploying a XState state machine on Restate

This example shows how to integrate Restate deeply with
[XState](https://stately.ai/docs/xstate). The code in [lib.ts](./lib.ts) and
[promise.ts](./promise.ts) converts an XState machine into two Restate
services:

1. A keyed service, which stores the state of the state machine, keyed on an
   identifier for this instance of the machine. This service is called with
   every event that must be processed by the state machine. XState machines are
   generally pure and are not async; side effects generally happen through
   [Promise Actors](https://stately.ai/docs/promise-actors). As such, this
   service should never block the machine, so other events can always be
   processed.
2. An unkeyed service, which exists solely to execute Promise Actors and call
   back to the state machine with their result. As this is an unkeyed service,
   the Promise won't hold up any other events. This service doesn't need to be
   called by you directly.

Both services are set up and managed automatically by interpreting the state
machine definition, and should generally be deployed together, whether as a
Lambda or as a long-lived service.

In `app.ts` you will see an example of an XState machine that uses cross-machine
communication, delays, and Promise actors, all running in Restate. However,
most XState machines should work out of the box; this is still experimental, so
we haven't tested everything yet!

To try out this example:

```bash
# start a local Restate instance
docker run -d -it --network=host --name restate_dev --rm restatedev/restate:0.8.1
# start the service
npm run dev
# register the state machine service against restate
npx @restatedev/restate@0.8.1 dep register http://localhost:9080

# create a state machine
curl http://localhost:8080/auth/create --json '{"key": "myMachine"}'
# watch the state
watch -n1 'curl -s http://localhost:8080/auth/snapshot --json "{\"key\": \"myMachine\"}"'
# kick off the machine
curl http://localhost:8080/auth/send --json '{"key": "myMachine", "request": {"event": {"type": "AUTH"}}}'
# and watch the auth flow progress!
```
