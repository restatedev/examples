import { createHmac, randomInt, randomUUID } from "node:crypto";
import { hmacSha256Hex } from "./signing";

// Deliveries shaped and signed as GitHub, Linear and Slack send them, trimmed to the fields that
// matter here. The sample sender posts them; the tests feed them to the read functions.

/** A request as the sender sends it: its headers, and the body whose exact bytes it signs. */
export type SignedRequest = { headers: Record<string, string>; body: string };

/** `request` as a handler sees it: lower-case header names, as Restate passes them, and bytes. */
export function asReceived(request: SignedRequest): [ReadonlyMap<string, string>, Uint8Array] {
  const headers = new Map<string, string>();
  for (const [name, value] of Object.entries(request.headers)) {
    headers.set(name.toLowerCase(), value);
  }
  return [headers, new TextEncoder().encode(request.body)];
}

const REPOSITORY = {
  id: 1296269,
  name: "widgets",
  full_name: "acme/widgets",
  private: false,
  html_url: "https://github.com/acme/widgets",
  owner: { login: "acme", type: "Organization" },
};
const OCTOCAT = { login: "octocat", id: 1, type: "User" };

export const github = {
  newDeliveryId: (): string => randomUUID(),

  /**
   * Signs `payload` as a GitHub webhook with `secret` would: as JSON, or in a `payload` form field
   * if the webhook's content type is application/x-www-form-urlencoded.
   */
  sign(
    secret: string,
    event: string,
    deliveryId: string,
    payload: object,
    contentType: "json" | "form" = "json"
  ): SignedRequest {
    const json = JSON.stringify(payload);
    const body = contentType === "json" ? json : new URLSearchParams({ payload: json }).toString();
    return {
      headers: {
        "content-type":
          contentType === "json" ? "application/json" : "application/x-www-form-urlencoded",
        "user-agent": "GitHub-Hookshot/044aadd",
        "x-github-event": event,
        "x-github-delivery": deliveryId,
        "x-github-hook-id": "292430182",
        "x-github-hook-installation-target-type": "repository",
        "x-github-hook-installation-target-id": String(REPOSITORY.id),
        // GitHub still sends the legacy SHA-1 signature next to the SHA-256 one.
        "x-hub-signature": `sha1=${createHmac("sha1", secret).update(body).digest("hex")}`,
        "x-hub-signature-256": `sha256=${hmacSha256Hex(secret, [body])}`,
      },
      body,
    };
  },

  ping: () => ({
    zen: "Design for failure.",
    hook_id: 292430182,
    hook: {
      type: "Repository",
      id: 292430182,
      active: true,
      events: ["issue_comment", "pull_request"],
      config: { content_type: "json", insecure_ssl: "0", url: "https://example.invalid/webhook" },
    },
    repository: REPOSITORY,
    sender: OCTOCAT,
  }),

  issueCommentCreated: (issueNumber: number, text: string) => ({
    action: "created",
    issue: {
      number: issueNumber,
      title: "Deliveries time out under load",
      state: "open",
      html_url: `${REPOSITORY.html_url}/issues/${issueNumber}`,
      user: OCTOCAT,
    },
    comment: {
      id: 1081119323,
      body: text,
      html_url: `${REPOSITORY.html_url}/issues/${issueNumber}#issuecomment-1081119323`,
      user: OCTOCAT,
      created_at: new Date().toISOString(),
    },
    repository: REPOSITORY,
    sender: OCTOCAT,
  }),

  pullRequestOpened: (number: number) => ({
    action: "opened",
    number,
    pull_request: {
      number,
      state: "open",
      title: "Retry deliveries with backoff",
      html_url: `${REPOSITORY.html_url}/pull/${number}`,
      user: OCTOCAT,
      draft: false,
      head: { ref: "retry-backoff" },
      base: { ref: "main" },
    },
    repository: REPOSITORY,
    sender: OCTOCAT,
  }),
};

const LINEAR_ORGANIZATION_ID = "a3d2f6e4-0c45-4f2b-9a8e-3f4b2c1d0e9f";
const LINEAR_ACTOR = {
  id: "2e6eea91-1111-0000-9486-acea0603064e",
  type: "user",
  name: "Ada Lovelace",
  url: "https://linear.app/acme/profiles/ada",
};

export const linear = {
  newDeliveryId: (): string => randomUUID(),
  newIssueId: (): string => randomUUID(),

  /** Signs `payload` as a Linear webhook with `secret` would. */
  sign(secret: string, deliveryId: string, payload: { type: string }): SignedRequest {
    const body = JSON.stringify(payload);
    return {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "user-agent": "Linear-Webhook",
        "linear-delivery": deliveryId,
        "linear-event": payload.type,
        "linear-signature": hmacSha256Hex(secret, [body]),
        "linear-timestamp": String(Date.now()),
      },
      body,
    };
  },

  issueCreated: (issueId: string, webhookTimestamp: number) => ({
    action: "create",
    actor: LINEAR_ACTOR,
    createdAt: new Date(webhookTimestamp).toISOString(),
    data: {
      id: issueId,
      identifier: "ENG-123",
      number: 123,
      title: "Deliveries time out under load",
      description: "Seen on the staging webhook since Monday.",
      priority: 2,
      team: { id: "72b2a2dc-6f4f-4423-9d34-24b5bd10634a", key: "ENG", name: "Engineering" },
      createdAt: new Date(webhookTimestamp).toISOString(),
    },
    url: "https://linear.app/acme/issue/ENG-123/deliveries-time-out-under-load",
    type: "Issue",
    organizationId: LINEAR_ORGANIZATION_ID,
    webhookTimestamp,
    webhookId: "000042e3-d123-4980-b49f-8e140eef9329",
  }),

  commentCreated: (issueId: string, text: string, webhookTimestamp: number) => ({
    action: "create",
    actor: LINEAR_ACTOR,
    createdAt: new Date(webhookTimestamp).toISOString(),
    data: {
      id: "2174add1-f7c8-44e3-bbf3-2d60b5ea8bc9",
      createdAt: new Date(webhookTimestamp).toISOString(),
      updatedAt: new Date(webhookTimestamp).toISOString(),
      archivedAt: null,
      body: text,
      edited: false,
      issueId,
      userId: LINEAR_ACTOR.id,
    },
    url: "https://linear.app/acme/issue/ENG-123/deliveries-time-out-under-load#comment-2174add1",
    type: "Comment",
    organizationId: LINEAR_ORGANIZATION_ID,
    webhookTimestamp,
    webhookId: "000042e3-d123-4980-b49f-8e140eef9329",
  }),
};

const SLACK_TEAM = "T0001AC3E";
const SLACK_APP = "A0001WHK1";
const SLACK_BOT_USER = "U0001BOT1";

export const slack = {
  newEventId: (): string => `Ev${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`,
  newTriggerId: (): string => `${randomInt(1e9, 1e10)}.${randomInt(1e9, 1e10)}.${randomUUID()}`,
  newChallenge: (): string => randomUUID().replace(/-/g, ""),

  /** Signs a JSON (Events API) body as Slack would, at `timestampS` (Unix seconds). */
  signJson: (secret: string, payload: object, timestampS: number): SignedRequest =>
    signSlack(secret, "application/json", JSON.stringify(payload), timestampS),

  /** Signs a form-encoded (slash command) body as Slack would, at `timestampS` (Unix seconds). */
  signForm: (secret: string, fields: Record<string, string>, timestampS: number): SignedRequest =>
    signSlack(
      secret,
      "application/x-www-form-urlencoded",
      new URLSearchParams(fields).toString(),
      timestampS
    ),

  urlVerification: (challenge: string) => ({
    token: "Jhj5dZrVaK7ZwHHjRyZWjbDl",
    challenge,
    type: "url_verification",
  }),

  appMention: (eventId: string, channel: string, text: string) => ({
    token: "XXYYZZ",
    team_id: SLACK_TEAM,
    api_app_id: SLACK_APP,
    event: {
      type: "app_mention",
      user: "U0002ADA1",
      text: `<@${SLACK_BOT_USER}> ${text}`,
      ts: "1731170000.000100",
      channel,
      event_ts: "1731170000.000100",
    },
    type: "event_callback",
    event_id: eventId,
    event_time: 1731170000,
    authorizations: [
      {
        enterprise_id: null,
        team_id: SLACK_TEAM,
        user_id: SLACK_BOT_USER,
        is_bot: true,
        is_enterprise_install: false,
      },
    ],
  }),

  slashCommand: (triggerId: string, channel: string, command: string, text: string) => ({
    token: "gIkuvaNzQIHg97ATvDxqgjtO",
    team_id: SLACK_TEAM,
    team_domain: "acme",
    channel_id: channel,
    channel_name: "deploys",
    user_id: "U0002ADA1",
    user_name: "ada",
    command,
    text,
    api_app_id: SLACK_APP,
    response_url: `https://hooks.slack.com/commands/${SLACK_TEAM}/1234/5678`,
    trigger_id: triggerId,
  }),
};

function signSlack(
  secret: string,
  contentType: string,
  body: string,
  timestampS: number
): SignedRequest {
  const timestamp = String(timestampS);
  return {
    headers: {
      "content-type": contentType,
      "user-agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
      "x-slack-request-timestamp": timestamp,
      "x-slack-signature": `v0=${hmacSha256Hex(secret, [`v0:${timestamp}:`, body])}`,
    },
    body,
  };
}
