# Incoming webhooks from GitHub, Linear and Slack

Incoming webhooks let GitHub, Linear and Slack invoke a service handler in Restate Cloud through a
dedicated URL. This example provides one webhook handler per sender. Each handler verifies the
sender's signature and forwards supported events to a virtual object with an idempotency key before
returning a response. The virtual objects process events sequentially for each issue, pull request
or channel, independently of the sender's response time limit.

| Sender | Webhook handler          | Mode          | Signature and timestamp checks                          | Idempotency key source                  | Target virtual object                    |
|--------|--------------------------|---------------|---------------------------------------------------------|-----------------------------------------|------------------------------------------|
| GitHub | `GitHubWebhook/receive`  | sync or async | `X-Hub-Signature-256`                                   | `X-GitHub-Delivery`                     | `GitHubThread`, keyed `owner/repo#123`   |
| Linear | `LinearWebhook/receive`  | sync          | `Linear-Signature`, `webhookTimestamp` within 1 minute  | `Linear-Delivery`                       | `LinearIssue`, keyed by issue ID         |
| Slack  | `SlackWebhook/receive`   | sync          | `X-Slack-Signature`, `X-Slack-Request-Timestamp` within 5 minutes | `event_id`; `trigger_id` for commands | `SlackChannel`, keyed by channel ID |

- **GitHub** ([github.ts](src/github.ts)): responds to `ping` and forwards `issue_comment` (created)
  and `pull_request` events. Issues and pull requests share a numbering sequence, so comments on a
  pull request and events for that pull request are forwarded to the same `GitHubThread`.
- **Linear** ([linear.ts](src/linear.ts)): forwards Issue and Comment `create` events to the
  corresponding `LinearIssue`, which processes them in the order they arrive.
- **Slack** ([slack.ts](src/slack.ts)): handles URL verification, events and slash commands through
  one Request URL. It returns the `url_verification` challenge, forwards `app_mention` events, and
  acknowledges slash commands while forwarding them for processing.
- **Sample sender** ([send_samples.ts](src/send_samples.ts)): sends signed sample deliveries in each
  sender's payload format to your webhook URLs and checks the responses.

## How the webhook handlers work

1. **Receive the raw request body.** Each handler declares
   `input: restate.serde.binary, accept: "*/*"` to receive the unmodified body as raw bytes,
   regardless of content type. Signature verification requires these exact bytes. This also allows
   the handler to accept `application/x-www-form-urlencoded` requests from Slack slash commands and
   GitHub webhooks configured to use form encoding.
2. **Verify the signature and timestamp.** The handler throws a `TerminalError` with code `401` if
   the signature is missing or invalid, or if the timestamp is outside the accepted window. Restate
   does not retry a `TerminalError`. Timestamp checks use `ctx.date.now()`, which records the time
   on the first attempt so retries of the same invocation compare against the same time.
3. **Forward the event and return a response.** The handler sends the event to a virtual object with
   the idempotency key `webhook:<sender>:<delivery ID>`. When a redelivery uses the same ID within
   the retention period, Restate deduplicates the request and returns the original invocation ID.
   The webhook handler returns that ID in the `forwarded` field.
4. **Process events in the virtual object.** A virtual object runs one exclusive handler at a time
   per key. Events for each issue or channel are processed sequentially, while different keys can
   be processed in parallel. Each object sets `idempotencyRetention` to cover its sender's retry
   period (GitHub allows manual redelivery for 3 days). The handlers in this example log and record
   events, which you can retrieve through their `history` handler. Add calls to LLMs or the senders'
   APIs in these handlers, inside `ctx.run`.

### Choose a delivery mode

A Restate Cloud webhook delivers in one of two modes:

- **Sync**: the sender receives `200` with the handler's JSON result, or the handler's
  `TerminalError` code as the response status, as with a regular HTTP call to the ingress.
- **Async**: the sender receives `202` when Restate accepts the invocation. The response does not
  include the handler's result. Deliveries rejected by the handler appear as failed invocations in
  the Restate UI.

Use sync mode for Slack, which requires the URL verification challenge and slash command replies in
the response. Linear also requires sync mode because it treats any response other than `200` as a
failure. You can use either mode for GitHub.

In async mode, Restate retains requests while your service is unavailable, so the handler may start
after a delay. Linear and Slack deliveries that exceed the accepted timestamp window are rejected,
even if their signatures are valid.

Restate Cloud forwards the sender's headers to `ctx.request().headers` with lowercase names. It
removes `Authorization`, `Cookie`, hop-by-hop headers, and headers with the `x-restate-` or
`x-restatecloud-` prefix, and adds `x-restatecloud-webhook-id`. Requests must include a `Content-Length`
header, and their bodies must not exceed 1 MiB.

## Run the example locally

Start Restate Server in a separate shell: `restate-server`.

Install the dependencies and start the services with signing secrets of your choice:

```shell
npm install
GITHUB_WEBHOOK_SECRET=gh-secret LINEAR_WEBHOOK_SECRET=linear-secret SLACK_SIGNING_SECRET=slack-secret npm run app-dev
```

Register the services:

```shell
restate deployments register http://localhost:9080
```

For local testing, use the Restate ingress endpoint `/<Service>/receive` for sync calls and
`/<Service>/receive/send` for async calls. Send the sample deliveries in sync mode:

```shell
GITHUB_WEBHOOK_URL=http://localhost:8080/GitHubWebhook/receive GITHUB_WEBHOOK_SECRET=gh-secret \
LINEAR_WEBHOOK_URL=http://localhost:8080/LinearWebhook/receive LINEAR_WEBHOOK_SECRET=linear-secret \
SLACK_WEBHOOK_URL=http://localhost:8080/SlackWebhook/receive SLACK_SIGNING_SECRET=slack-secret \
npm run send-samples
```

```text
GitHub (sync mode)
ok   github ping
ok   github issue_comment
ok   github issue_comment redelivered
ok   github pull_request opened
ok   github unhandled event ignored
ok   github bad signature rejected
Linear (sync mode)
ok   linear issue created
...
ok   slack stale timestamp rejected
```

For async mode, append `/send` to each URL and run `npm run send-samples -- --mode async`. Each
accepted invocation returns `202`. Inspect the invocation results in the Restate UI at
`localhost:9070`.

The `redelivered` and `retried` checks pass only if both deliveries return the same forwarded
invocation ID. In the Restate UI, you can verify that the pair produces one `onEvent` or `onMention`
invocation and that the object's `history` state contains the event once.

## Connect GitHub, Linear and Slack through Restate Cloud

1. Deploy the services, register them with your Restate Cloud environment, and set the three secret
   environment variables on the deployment (any value for a sender you do not use).
2. In Restate Cloud, create a webhook for each sender, targeting its `receive` handler, in the mode
   from the table above.
3. Configure each sender with its webhook URL and set its signing secret in the deployment's
   environment:
   - **GitHub**: in the repository's settings, add a webhook with the URL, content type
     `application/json` and a secret (`GITHUB_WEBHOOK_SECRET`), for issue comment and pull request
     events. GitHub immediately sends a `ping`. GitHub does not automatically retry failed
     deliveries, including `5xx` responses. For example, a webhook returns `503` if Restate Cloud
     temporarily cannot look up the webhook. To retry a failed delivery, select **Redeliver** under
     the webhook's Recent Deliveries. A redelivery preserves the delivery ID, which Restate uses
     for deduplication within the configured retention period.
   - **Linear**: create a webhook for Issues and Comments with the URL, and copy its signing secret
     (`LINEAR_WEBHOOK_SECRET`).
   - **Slack**: in the app's settings, enter the URL as the Event Subscriptions Request URL (Slack
     verifies it with a challenge), subscribe to the `app_mention` bot event, and use the same URL for
     a slash command. The signing secret (`SLACK_SIGNING_SECRET`) is under Basic Information.
4. Verify the setup with `npm run send-samples`, using the webhook URLs and secrets. The script does
   not print these values. Anyone with a webhook URL can invoke its handler.

## Run the tests

Run the unit tests for signature verification and request parsing without starting a server:

```shell
npm test
```

The tests check HMAC verification against GitHub's and Slack's published test vectors and validate
each sender's deliveries, including `401` and `400` rejections. Use `npm run send-samples` for the
end-to-end check described above.
