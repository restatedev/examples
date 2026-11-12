import * as restate from "@restatedev/restate-sdk";
import { readHistory, recordEvent } from "./history";
import {
  badRequest,
  bodyText,
  idempotencyKey,
  parseJsonObject,
  requireField,
  secretFromEnv,
  unauthorized,
} from "./requests";
import { hmacMatches } from "./signing";

// Slack signs every request: X-Slack-Signature is `v0=` and the hex HMAC-SHA256, under the app's
// signing secret, of `v0:<X-Slack-Request-Timestamp>:<raw body>`. Slack waits 3 seconds, and reads
// the URL verification challenge and slash command replies from the response, so use sync mode.
// One handler takes both kinds of request Slack sends: Events API callbacks (JSON) and slash
// commands (form-encoded), so the app's Event Subscriptions and slash commands can share one URL.
// https://docs.slack.dev/authentication/verifying-requests-from-slack

/** Slack asks you to reject requests whose timestamp is more than five minutes from now. */
export const SLACK_TIMESTAMP_TOLERANCE_S = 5 * 60;

/** The parts of Events API payloads this example reads, all optional until checked. */
interface SlackEventsPayload {
  type?: string;
  challenge?: string;
  event_id?: string;
  event?: { type?: string; channel?: string; user?: string; text?: string; ts?: string };
}

/** An app_mention event: someone wrote @your-app in a channel. */
export type SlackMention = { eventId: string; user: string; text: string; ts: string };

/** A slash command, such as `/deploy staging`. */
export type SlackCommand = {
  triggerId: string;
  user: string;
  command: string;
  text: string;
  /** Where to post the answer once it is ready. */
  responseUrl: string;
};

export type SlackRequest =
  | { kind: "url_verification"; challenge: string }
  | { kind: "mention"; channel: string; mention: SlackMention }
  | { kind: "command"; channel: string; command: SlackCommand }
  | { kind: "ignored"; event: string };

/**
 * Verifies a Slack request's signature and timestamp and reads it. Throws a TerminalError with 401
 * if the signature is missing or wrong or the timestamp is outside the window around `nowMs`, and
 * 400 if the request is malformed.
 */
export function readSlackRequest(
  headers: ReadonlyMap<string, string>,
  body: Uint8Array,
  secret: string,
  nowMs: number
): SlackRequest {
  const timestamp = headers.get("x-slack-request-timestamp") ?? "";
  const signature = headers.get("x-slack-signature");
  if (
    !signature?.startsWith("v0=") ||
    !hmacMatches(secret, [`v0:${timestamp}:`, body], signature.slice("v0=".length))
  ) {
    throw unauthorized("Missing or invalid X-Slack-Signature");
  }
  const sentAt = Number(timestamp);
  if (!Number.isInteger(sentAt) || Math.abs(nowMs / 1000 - sentAt) > SLACK_TIMESTAMP_TOLERANCE_S) {
    throw unauthorized("X-Slack-Request-Timestamp is too far from now");
  }

  if (headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return readSlackForm(new URLSearchParams(bodyText(body)));
  }
  return readSlackEvent(parseJsonObject(bodyText(body)) as SlackEventsPayload);
}

function readSlackEvent(payload: SlackEventsPayload): SlackRequest {
  if (payload.type === "url_verification") {
    return { kind: "url_verification", challenge: requireField(payload.challenge, "challenge") };
  }
  if (payload.type === "event_callback" && payload.event?.type === "app_mention") {
    const event = payload.event;
    return {
      kind: "mention",
      channel: requireField(event.channel, "event.channel"),
      mention: {
        // Unique per event, so Slack's retries of an event share it.
        eventId: requireField(payload.event_id, "event_id"),
        user: event.user ?? "",
        text: event.text ?? "",
        ts: event.ts ?? "",
      },
    };
  }
  return { kind: "ignored", event: payload.event?.type ?? payload.type ?? "unknown" };
}

function readSlackForm(form: URLSearchParams): SlackRequest {
  const command = form.get("command");
  if (command !== null) {
    return {
      kind: "command",
      channel: requireField(form.get("channel_id"), "channel_id"),
      command: {
        // Unique per invocation of the command.
        triggerId: requireField(form.get("trigger_id"), "trigger_id"),
        user: form.get("user_id") ?? "",
        command,
        text: form.get("text") ?? "",
        responseUrl: form.get("response_url") ?? "",
      },
    };
  }
  // Slack checks the certificate of publicly distributed apps with `ssl_check=1`. Interactive
  // components (buttons, modals) post their JSON in a `payload` field; read it like an event.
  if (form.get("ssl_check") === "1") return { kind: "ignored", event: "ssl_check" };
  if (form.has("payload")) return { kind: "ignored", event: "interactivity" };
  throw badRequest("Form body is neither a slash command nor a Slack check");
}

/**
 * A Slack channel, keyed by its ID. The channel's mentions and commands are handled one at a time,
 * in the order they arrived.
 */
export const slackChannel = restate.object({
  name: "SlackChannel",
  handlers: {
    onMention: async (ctx: restate.ObjectContext, mention: SlackMention) => {
      ctx.console.info(`${ctx.key}: mention by ${mention.user}`);
      // Answer here, free of Slack's 3 seconds: call an LLM, then chat.postMessage in the
      // mention's thread (thread_ts = mention.ts). Wrap each side effect in ctx.run.
      await recordEvent(ctx, mention);
    },

    onCommand: async (ctx: restate.ObjectContext, command: SlackCommand) => {
      ctx.console.info(`${ctx.key}: ${command.command} by ${command.user}`);
      // Do the work here, then post the answer to command.responseUrl inside ctx.run.
      await recordEvent(ctx, command);
    },

    history: restate.handlers.object.shared(async (ctx: restate.ObjectSharedContext) =>
      readHistory<SlackMention | SlackCommand>(ctx)
    ),
  },
  options: {
    // How long Restate remembers an idempotency key. Slack retries an event for minutes, or for a
    // day if the app enables Delayed Events.
    idempotencyRetention: { days: 2 },
  },
});

export type SlackReply =
  | { challenge: string }
  | { forwarded: string }
  | { response_type: "ephemeral"; text: string }
  | { ignored: string };

/**
 * The target of a Slack app's Request URL, in sync mode. It verifies the request, answers what must
 * be answered in the response, hands the rest to SlackChannel and returns.
 */
export const slackWebhook = restate.service({
  name: "SlackWebhook",
  handlers: {
    receive: restate.handlers.handler(
      // Slash commands are form-encoded: a JSON-only handler would refuse them.
      { input: restate.serde.binary, accept: "*/*" },
      async (ctx: restate.Context, body: Uint8Array): Promise<SlackReply> => {
        const secret = secretFromEnv("SLACK_SIGNING_SECRET");
        // ctx.date.now() is journaled: a retry of this handler checks against the same time.
        const request = readSlackRequest(ctx.request().headers, body, secret, await ctx.date.now());
        switch (request.kind) {
          case "url_verification":
            // Slack sends this when you set the Request URL, and expects the challenge back.
            return { challenge: request.challenge };
          case "mention": {
            const send = ctx.objectSendClient(slackChannel, request.channel).onMention(
              request.mention,
              restate.rpc.sendOpts({
                idempotencyKey: idempotencyKey("slack", request.mention.eventId),
              })
            );
            return { forwarded: await send.invocationId };
          }
          case "command":
            ctx.objectSendClient(slackChannel, request.channel).onCommand(
              request.command,
              restate.rpc.sendOpts({
                idempotencyKey: idempotencyKey("slack", request.command.triggerId),
              })
            );
            // Slack shows this to the user who ran the command, at once.
            return {
              response_type: "ephemeral",
              text: `Working on ${request.command.command} ${request.command.text}`.trim(),
            };
          case "ignored":
            return { ignored: request.event };
        }
      }
    ),
  },
});
