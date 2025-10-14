# Next.js + Restate Template

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
This example shows how to integrate Next.js with [Restate](https://restate.dev/).

The Next.js app implements and exposes a set of Restate services that are invoked from the UI. 
The services are implemented in TypeScript and use the Restate SDK for TypeScript.

Most important files:
- [`restate/services/greeter.ts`](restate/greeter.ts): The Restate service that implements the greeting logic.
- [`app/page.tsx`](app/page.tsx): A Next.js page that renders the UI and calls the Restate service.
- [`restate/serve.ts`](restate/serve.ts): Defines the Restate fetch endpoint that runs the services and is initialized in [`app/restate/[[...services]]/route.ts`](app/restate/[[...services]]/route.ts) by the Next.js app.

## Getting Started

First, start the Restate Server ([after following the installation instructions](https://docs.restate.dev/develop/local_dev)):

```shell
restate-server
```

Then, run the app:

```shell
npm i
npm run dev
```

Register Restate services, in `app/restate/[[...services]]/route.ts`:

```shell
restate deployments register http://localhost:3000/restate --use-http1.1
```

Check out the UI at `http://localhost:3000` and send a greeting.

You should see the greeting response `You said hi to Bob!` in the UI.

## See Durable Execution in action

Let's have a look at how Restate makes this application resilient, by introducing simulated failures.

The [greeter](restate/greeter.ts) service first sends a notification, then waits a second and then sends a reminder, and then returns a greeting.

If you run the app, with the `SIMULATE_FAILURES=true` it will crash repeatedly on the sending of the reminder. 

```shell
SIMULATE_FAILURES=true npm run dev
```

Submit another greeting from the UI and then check the invocation tab of the Restate UI to see the retries: `http://localhost:9070`

Or in the app logs:

```log
[👻 SIMULATED] Failed to send reminder: 99f9f089-a7a6-4c7a-8ad2-55e804f3b764
[restate] [Greeter/greet][inv_1iib7JPjTjRw4LRLH8irJjSiI14kzCvKCd][2025-04-11T11:51:07.243Z] WARN:  Function completed with an error.
 Error: [👻 SIMULATED] Failed to send reminder: 99f9f089-a7a6-4c7a-8ad2-55e804f3b764
    at sendReminder (restate/services/utils.ts:9:14)
    at eval (restate/services/greeter.ts:12:51)
    at Object.greet (restate/services/greeter.ts:12:16)
   7 |     if (simulateFailures) {
   8 |         console.error(`[👻 SIMULATED] Failed to send reminder: ${greetingId}`);
>  9 |         throw new Error(`[👻 SIMULATED] Failed to send reminder: ${greetingId}`);
     |              ^
  10 |     }
  11 |     console.log(`Reminder sent: ${greetingId}`);
  12 | }
 POST /restate/v1/invoke/Greeter/greet 200 in 28ms
```

Restate will keep retrying the reminder until it succeeds.

To let the reminder succeed, you can restart the app without `SIMULATE_FAILURES=true`:
```shell
npm run dev
```

Then, the reminder will succeed and you will see the greeting in the UI.

