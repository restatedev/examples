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

// Linear signs the raw body of each delivery with the webhook's signing secret (HMAC-SHA256, hex)
// and sends it in the Linear-Signature header. Linear-Delivery identifies the delivery. Linear
// counts anything but HTTP 200 within 5 seconds as a failure and retries, so use sync mode: async
// mode answers 202.
// https://linear.app/developers/webhooks

/**
 * Linear recommends rejecting a delivery whose webhookTimestamp is more than a minute from now. The
 * timestamp is inside the signed body, unlike Linear-Delivery, so this is what stops someone from
 * replaying a captured delivery under a new delivery ID. In async mode the handler can first run
 * later than that (Restate holds the request while your service is down) and would then reject
 * genuine deliveries; widen the window if you use async mode.
 */
export const LINEAR_TIMESTAMP_TOLERANCE_MS = 60_000;

/** The parts of Linear's payloads this example reads, all optional until checked. */
interface LinearPayload {
  action?: string;
  type?: string;
  url?: string;
  webhookTimestamp?: number;
  actor?: { name?: string };
  data?: { id?: string; title?: string; body?: string; issueId?: string };
}

/** What LinearIssue receives. */
export type LinearIssueEvent = {
  deliveryId: string;
  event: "issue_created" | "comment_created";
  author: string;
  /** The issue's title, or the comment's body. */
  text: string;
  url: string;
};

export type LinearDelivery =
  | { kind: "issue"; issueId: string; event: LinearIssueEvent }
  | { kind: "ignored"; event: string };

/**
 * Verifies a Linear delivery's signature and timestamp and reads it. Throws a TerminalError with
 * 401 if the signature is missing or wrong or the timestamp is outside the window around `nowMs`,
 * and 400 if the delivery is malformed.
 */
export function readLinearDelivery(
  headers: ReadonlyMap<string, string>,
  body: Uint8Array,
  secret: string,
  nowMs: number
): LinearDelivery {
  if (!hmacMatches(secret, [body], headers.get("linear-signature"))) {
    throw unauthorized("Missing or invalid Linear-Signature");
  }
  const payload = parseJsonObject(bodyText(body)) as LinearPayload;
  const sentAt = payload.webhookTimestamp;
  if (typeof sentAt !== "number" || Math.abs(nowMs - sentAt) > LINEAR_TIMESTAMP_TOLERANCE_MS) {
    throw unauthorized("webhookTimestamp is missing or too far from now");
  }
  const deliveryId = requireHeader(headers, "linear-delivery");
  const data = requireField(payload.data, "data");
  const event = (event: LinearIssueEvent["event"], text: string | undefined) => ({
    deliveryId,
    event,
    author: payload.actor?.name ?? "",
    text: text ?? "",
    url: payload.url ?? "",
  });

  if (payload.type === "Issue" && payload.action === "create") {
    return {
      kind: "issue",
      issueId: requireField(data.id, "data.id"),
      event: event("issue_created", data.title),
    };
  }
  if (payload.type === "Comment" && payload.action === "create") {
    return {
      kind: "issue",
      issueId: requireField(data.issueId, "data.issueId"),
      event: event("comment_created", data.body),
    };
  }
  return { kind: "ignored", event: `${payload.type}.${payload.action}` };
}

/**
 * A Linear issue, keyed by its ID. An issue's events are processed one at a time, in the order
 * they arrived, so a comment is never handled before the issue it belongs to.
 */
export const linearIssue = restate.object({
  name: "LinearIssue",
  handlers: {
    onEvent: async (ctx: restate.ObjectContext, event: LinearIssueEvent) => {
      ctx.console.info(`${ctx.key}: ${event.event} by ${event.author}`);
      // The slow work goes here, free of Linear's 5-second limit: triage, assign, reply through
      // Linear's API. Wrap each side effect in ctx.run.
      await recordEvent(ctx, event);
    },

    history: restate.handlers.object.shared(async (ctx: restate.ObjectSharedContext) =>
      readHistory<LinearIssueEvent>(ctx)
    ),
  },
  options: {
    // How long Restate remembers an idempotency key. Linear's last retry comes about 7 hours
    // after the first attempt.
    idempotencyRetention: { days: 1 },
  },
});

export type LinearReply = { forwarded: string } | { ignored: string };

/**
 * The target of a Linear webhook, in sync mode. It verifies the delivery, hands the work to
 * LinearIssue and returns, well within Linear's 5 seconds.
 */
export const linearWebhook = restate.service({
  name: "LinearWebhook",
  handlers: {
    receive: restate.handlers.handler(
      { input: restate.serde.binary, accept: "*/*" },
      async (ctx: restate.Context, body: Uint8Array): Promise<LinearReply> => {
        const secret = secretFromEnv("LINEAR_WEBHOOK_SECRET");
        // ctx.date.now() is journaled: a retry of this handler checks against the same time.
        const delivery = readLinearDelivery(
          ctx.request().headers,
          body,
          secret,
          await ctx.date.now()
        );
        if (delivery.kind === "ignored") return { ignored: delivery.event };
        const send = ctx.objectSendClient(linearIssue, delivery.issueId).onEvent(
          delivery.event,
          restate.rpc.sendOpts({
            idempotencyKey: idempotencyKey("linear", delivery.event.deliveryId),
          })
        );
        return { forwarded: await send.invocationId };
      }
    ),
  },
});
