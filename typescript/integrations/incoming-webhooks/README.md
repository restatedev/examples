# Incoming webhooks from GitHub, Linear and Slack

Restate Cloud can give a handler its own webhook URL, which you hand to GitHub, Linear or Slack.
This example has one webhook handler per sender. Each one checks the sender's signature, hands the
work to a virtual object with an idempotency key, and returns well within the sender's time limit.
The objects do the slow work, one event at a time per issue, pull request or channel.

| Sender | Webhook handler          | Mode          | Checks                                                  | Deduplicates by                         | Hands work to                            |
|--------|--------------------------|---------------|---------------------------------------------------------|-----------------------------------------|------------------------------------------|
| GitHub | `GitHubWebhook/receive`  | sync or async | `X-Hub-Signature-256`                                   | `X-GitHub-Delivery`                     | `GitHubThread`, keyed `owner/repo#123`   |
| Linear | `LinearWebhook/receive`  | sync          | `Linear-Signature`, `webhookTimestamp` within 1 minute  | `Linear-Delivery`                       | `LinearIssue`, keyed by issue ID         |
| Slack  | `SlackWebhook/receive`   | sync          | `X-Slack-Signature`, `X-Slack-Request-Timestamp` within 5 minutes | `event_id`; `trigger_id` for commands | `SlackChannel`, keyed by channel ID |

- **GitHub** ([github.ts](src/github.ts)): answers `ping`, and forwards `issue_comment` (created) and
  `pull_request` events. Issues and pull requests share numbers, so a pull request's comments and
  its own events reach the same `GitHubThread`.
- **Linear** ([linear.ts](src/linear.ts)): forwards Issue and Comment `create` events. A comment goes
  to its issue's `LinearIssue`, after the issue's earlier events.
- **Slack** ([slack.ts](src/slack.ts)): one handler takes everything a Slack app sends to its Request
  URL. It returns the `url_verification` challenge, forwards `app_mention` events, and replies to
  slash commands at once while forwarding the work.
- **Sample sender** ([send_samples.ts](src/send_samples.ts)): posts signed deliveries, shaped like the
  senders' own, to your webhook URLs and checks the responses.

## How the webhook handlers work

1. **Raw input.** Each handler declares `input: restate.serde.binary, accept: "*/*"`. The signature
   covers the body's exact bytes, so the handler must see those bytes, not re-serialized JSON. And
   Slack slash commands (and GitHub webhooks set to form encoding) are
   `application/x-www-form-urlencoded`: a JSON-only handler refuses them.
2. **Verify first.** A missing or wrong signature, or a timestamp outside the sender's window, throws
   a `TerminalError` with code 401. Restate does not retry a `TerminalError`. The time windows compare
   against `ctx.date.now()`, which is journaled, so a retried handler sees the time of its first
   attempt.
3. **Forward and return.** The handler sends the work to a virtual object with the idempotency key
   `webhook:<sender>:<delivery ID>`. Senders retry, and send the same delivery ID each time: Restate
   runs the work once and returns the first invocation's ID to the retries. The handler returns that
   ID as `forwarded`.
4. **Slow work in the object.** A virtual object runs one exclusive handler at a time per key, so an
   issue's or channel's events are processed in order, and different keys in parallel. Each object
   sets `idempotencyRetention` to cover its sender's retries (GitHub lets you redeliver for 3 days).
   The handlers here only log and record events (see their `history` handler); call LLMs and the
   senders' APIs there, inside `ctx.run`.

### Sync or async delivery

A Restate Cloud webhook delivers in one of two modes:

- **Sync**: like a call to the ingress. The sender gets 200 with the handler's JSON result, or the
  handler's `TerminalError` code as the status.
- **Async**: the sender gets 202 at once and never sees the result. Rejected deliveries show up only
  as failed invocations in the Restate UI.

Slack needs sync: it reads the URL verification challenge and slash command replies from the
response. Linear needs sync too, as it treats anything but 200 as a failure. GitHub works with
either. With async, a handler can start later than the delivery (Restate holds requests while your
service is unavailable), and then the Linear and Slack time windows reject genuine deliveries.

Restate Cloud passes the sender's headers to `ctx.request().headers` in lower case, except
`Authorization`, `Cookie`, hop-by-hop headers and `x-restate-*` and `x-restatecloud-*` headers, and
adds `x-restatecloud-webhook-id`. It accepts bodies of up to 1 MiB, sent with `Content-Length`.

## Run it locally

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

The ingress answers like a sync webhook at `/<Service>/receive`, and like an async one at
`/<Service>/receive/send`. Send the samples through it in sync mode:

```shell
GITHUB_WEBHOOK_URL=http://localhost:8080/GitHubWebhook/receive GITHUB_WEBHOOK_SECRET=gh-secret \
LINEAR_WEBHOOK_URL=http://localhost:8080/LinearWebhook/receive LINEAR_WEBHOOK_SECRET=linear-secret \
SLACK_WEBHOOK_URL=http://localhost:8080/SlackWebhook/receive SLACK_SIGNING_SECRET=slack-secret \
npm run send-samples
```

```
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

For async mode, append `/send` to each URL and run `npm run send-samples -- --mode async`. Every
delivery then gets 202, and the outcomes are in the Restate UI at `localhost:9070`.

The `redelivered` and `retried` checks pass only if the second delivery reaches the invocation the
first one started. In the Restate UI you see one `onEvent` or `onMention` invocation for the pair,
and the object's `history` state holds the event once.

## Connect GitHub, Linear and Slack through Restate Cloud

1. Deploy the services, register them with your Restate Cloud environment, and set the three secret
   environment variables on the deployment (any value for a sender you do not use).
2. In Restate Cloud, create a webhook for each sender, targeting its `receive` handler, in the mode
   from the table above.
3. Give each sender its webhook URL, and copy its signing secret into the deployment's environment:
   - **GitHub**: in the repository's settings, add a webhook with the URL, content type
     `application/json` and a secret (`GITHUB_WEBHOOK_SECRET`), for issue comment and pull request
     events. GitHub sends a `ping` at once.
   - **Linear**: create a webhook for Issues and Comments with the URL, and copy its signing secret
     (`LINEAR_WEBHOOK_SECRET`).
   - **Slack**: in the app's settings, enter the URL as the Event Subscriptions Request URL (Slack
     verifies it with a challenge), subscribe to the `app_mention` bot event, and use the same URL for
     a slash command. The signing secret (`SLACK_SIGNING_SECRET`) is under Basic Information.
4. Check the setup with `npm run send-samples`, using the webhook URLs and secrets. The script never
   prints them: a webhook URL lets anyone who has it invoke your handler.

## Test

```shell
npm test
```

runs unit tests of the signature checks and request parsing, with no server: the HMAC check against
GitHub's and Slack's published test vectors, and each sender's deliveries, including the 401 and 400
rejections. `npm run send-samples` is the end-to-end check described above.

## Not confirmed

These points are not stated in the senders' documentation, and the example was not run against real
GitHub, Linear or Slack deliveries:

- **Linear retries.** Linear retries after 1 minute, 1 hour and 6 hours, but does not say whether a
  retry keeps the original `Linear-Delivery` and `webhookTimestamp`. If it keeps the timestamp, the
  one-minute window rejects every retry.
- **Linear payloads.** Linear publishes no signature test vector and no example Issue payload; the
  Issue sample follows the documented data-change fields and the Comment example.
- **Slack retries and commands.** That a retried event keeps its `event_id` follows from the ID being
  unique per event, but Slack does not say so. Slack does not say whether it retries slash commands;
  deduplicating by `trigger_id` is a precaution.
- **GitHub form encoding.** That a form-encoded delivery is signed over the form body, not the JSON
  inside it, follows from GitHub signing the request body; GitHub does not show an example.
- **Restate Cloud.** The sample sender ran against a local `restate-server` ingress, which does not
  filter headers or limit body size like Restate Cloud webhooks. GitHub payloads can reach 25 MB;
  any over 1 MiB will not reach the handler.
