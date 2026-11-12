import * as restate from "@restatedev/restate-sdk";
import { readHistory, recordEvent } from "./history";
import {
  bodyText,
  idempotencyKey,
  parseJsonObject,
  requireField,
  requireHeader,
  secretFromEnv,
  unauthorized,
} from "./requests";
import { hmacMatches } from "./signing";

// GitHub signs the raw body of each delivery with the webhook's secret (HMAC-SHA256, hex) and
// sends it as `X-Hub-Signature-256: sha256=<hex>`. X-GitHub-Delivery identifies the delivery and
// stays the same when you redeliver it. GitHub waits 10 seconds for a 2xx and does not retry on
// its own.
// https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries

/** The parts of GitHub's payloads this example reads, all optional until checked. */
interface GitHubPayload {
  action?: string;
  zen?: string;
  repository?: { full_name?: string };
  issue?: { number?: number };
  comment?: { body?: string; html_url?: string; user?: { login?: string } };
  number?: number;
  pull_request?: { title?: string; html_url?: string; user?: { login?: string } };
}

/** What GitHubThread receives: a few fields, not the payload, which embeds the whole repository. */
export type GitHubThreadEvent = {
  deliveryId: string;
  event: "issue_comment" | "pull_request";
  action: string;
  author: string;
  /** The comment's body, or the pull request's title. */
  text: string;
  url: string;
};

export type GitHubDelivery =
  | { kind: "ping"; zen: string }
  // `thread` is `owner/repo#number`. Issues and pull requests share numbers, and comments on a
  // pull request arrive as issue_comment events, so a pull request's events share a thread.
  | { kind: "thread"; thread: string; event: GitHubThreadEvent }
  | { kind: "ignored"; event: string };

/**
 * Verifies a GitHub delivery's signature and reads it. Throws a TerminalError with 401 if the
 * signature is missing or wrong, and 400 if the delivery is malformed.
 */
export function readGitHubDelivery(
  headers: ReadonlyMap<string, string>,
  body: Uint8Array,
  secret: string
): GitHubDelivery {
  const signature = headers.get("x-hub-signature-256");
  if (
    !signature?.startsWith("sha256=") ||
    !hmacMatches(secret, [body], signature.slice("sha256=".length))
  ) {
    throw unauthorized("Missing or invalid X-Hub-Signature-256");
  }
  const deliveryId = requireHeader(headers, "x-github-delivery");
  const eventName = requireHeader(headers, "x-github-event");
  // A webhook set to application/x-www-form-urlencoded sends the JSON in a `payload` field.
  const text = headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")
    ? requireField(new URLSearchParams(bodyText(body)).get("payload"), "payload")
    : bodyText(body);
  const payload = parseJsonObject(text) as GitHubPayload;
  const repository = () => requireField(payload.repository?.full_name, "repository.full_name");

  if (eventName === "ping") return { kind: "ping", zen: payload.zen ?? "" };

  if (eventName === "issue_comment" && payload.action === "created") {
    const comment = requireField(payload.comment, "comment");
    return {
      kind: "thread",
      thread: `${repository()}#${requireField(payload.issue?.number, "issue.number")}`,
      event: {
        deliveryId,
        event: "issue_comment",
        action: payload.action,
        author: comment.user?.login ?? "",
        text: comment.body ?? "",
        url: comment.html_url ?? "",
      },
    };
  }

  if (eventName === "pull_request") {
    const pullRequest = requireField(payload.pull_request, "pull_request");
    return {
      kind: "thread",
      thread: `${repository()}#${requireField(payload.number, "number")}`,
      event: {
        deliveryId,
        event: "pull_request",
        action: requireField(payload.action, "action"),
        author: pullRequest.user?.login ?? "",
        text: pullRequest.title ?? "",
        url: pullRequest.html_url ?? "",
      },
    };
  }

  return { kind: "ignored", event: payload.action ? `${eventName}.${payload.action}` : eventName };
}

/**
 * An issue or pull request, keyed `owner/repo#number`. Restate runs one exclusive handler at a time
 * per key, so a thread's events are processed in the order they arrived, and threads in parallel.
 */
export const gitHubThread = restate.object({
  name: "GitHubThread",
  handlers: {
    onEvent: async (ctx: restate.ObjectContext, event: GitHubThreadEvent) => {
      ctx.console.info(`${ctx.key}: ${event.event}.${event.action} by ${event.author}`);
      // The slow work goes here, free of GitHub's 10-second limit: triage with an LLM, run
      // checks, reply through GitHub's API. Wrap each side effect in ctx.run.
      await recordEvent(ctx, event);
    },

    history: restate.handlers.object.shared(async (ctx: restate.ObjectSharedContext) =>
      readHistory<GitHubThreadEvent>(ctx)
    ),
  },
  options: {
    // How long Restate remembers an idempotency key. GitHub lets you redeliver for 3 days.
    idempotencyRetention: { days: 3 },
  },
});

export type GitHubReply = { event: "ping" } | { forwarded: string } | { ignored: string };

/**
 * The target of a GitHub webhook. It verifies the delivery, hands the work to GitHubThread and
 * returns, well within GitHub's 10 seconds, so it suits both delivery modes. In sync mode GitHub
 * records the returned JSON as the delivery's response.
 */
export const gitHubWebhook = restate.service({
  name: "GitHubWebhook",
  handlers: {
    receive: restate.handlers.handler(
      // The raw body, whatever its content type: the signature covers its exact bytes.
      { input: restate.serde.binary, accept: "*/*" },
      async (ctx: restate.Context, body: Uint8Array): Promise<GitHubReply> => {
        const secret = secretFromEnv("GITHUB_WEBHOOK_SECRET");
        const delivery = readGitHubDelivery(ctx.request().headers, body, secret);
        switch (delivery.kind) {
          case "ping":
            return { event: "ping" };
          case "ignored":
            return { ignored: delivery.event };
          case "thread": {
            const send = ctx.objectSendClient(gitHubThread, delivery.thread).onEvent(
              delivery.event,
              restate.rpc.sendOpts({
                idempotencyKey: idempotencyKey("github", delivery.event.deliveryId),
              })
            );
            return { forwarded: await send.invocationId };
          }
        }
      }
    ),
  },
});
