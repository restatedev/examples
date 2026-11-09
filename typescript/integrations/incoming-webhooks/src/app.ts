import * as restate from "@restatedev/restate-sdk";
import { gitHubThread, gitHubWebhook } from "./github";
import { linearIssue, linearWebhook } from "./linear";
import { slackChannel, slackWebhook } from "./slack";

// Each <Sender>Webhook service has one handler, `receive`, which a Restate Cloud webhook targets.
// It verifies the delivery, forwards the work to a virtual object with an idempotency key, and
// returns at once. The objects do the slow work, one event at a time per issue, thread or channel.
restate.serve({
  services: [gitHubWebhook, gitHubThread, linearWebhook, linearIssue, slackWebhook, slackChannel],
  port: 9080,
});
