import { parseArgs } from "node:util";
import { github, linear, slack, SignedRequest } from "./sample_deliveries";

// Sends signed sample deliveries to webhook URLs and checks the responses.
//
//   GITHUB_WEBHOOK_URL=... GITHUB_WEBHOOK_SECRET=... \
//   LINEAR_WEBHOOK_URL=... LINEAR_WEBHOOK_SECRET=... \
//   SLACK_WEBHOOK_URL=...  SLACK_SIGNING_SECRET=... \
//   npm run send-samples -- [--mode sync|async]
//
// Senders without a URL are skipped. The script prints neither URLs nor secrets: a Restate Cloud
// webhook URL lets anyone who has it invoke your handler.
//
// --mode sync (the default) checks what the sender sees from a sync webhook, or from Restate's
// ingress at /<Service>/receive: the handler's result or its error code. --mode async checks for
// the 202 that an async webhook, or the ingress at /<Service>/receive/send, answers before the
// handler runs; then look for the invocations in the Restate UI.

type Mode = "sync" | "async";
type Response = { status: number; body: string };
/** Returns what is wrong with a sync response's JSON body, or undefined if nothing is. */
type BodyCheck = (json: any) => string | undefined;

const { values: args } = parseArgs({ options: { mode: { type: "string", default: "sync" } } });
const mode = args.mode as Mode;
if (mode !== "sync" && mode !== "async") throw new Error("--mode is sync or async");

let failures = 0;

/** Posts `request` to `url`, checks the response and prints the outcome; returns the JSON body. */
async function check(
  name: string,
  url: string,
  request: SignedRequest,
  syncStatus: number,
  syncBody?: BodyCheck
): Promise<any> {
  const response = await post(url, request);
  const status = mode === "sync" ? syncStatus : 202;
  let problem: string | undefined;
  let json: any;
  if ("error" in response) {
    problem = response.error;
  } else if (response.status !== status) {
    problem = `expected ${status}, got ${response.status}: ${response.body.slice(0, 200)}`;
  } else if (mode === "sync" && syncBody) {
    json = parseJson(response.body);
    problem = syncBody(json);
    if (problem) problem += `: ${response.body.slice(0, 200)}`;
  }
  if (problem) failures++;
  console.log(problem ? `FAIL ${name}: ${problem}` : `ok   ${name}`);
  return json;
}

async function post(url: string, request: SignedRequest): Promise<Response | { error: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
    });
    return { status: response.status, body: await response.text() };
  } catch (error) {
    // The error's message or cause can include the URL; report only its code.
    const cause = (error as { cause?: { code?: string } }).cause;
    return { error: `request failed (${cause?.code ?? (error as Error).name})` };
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

const forwarded: BodyCheck = (json) =>
  typeof json?.forwarded === "string" ? undefined : "no forwarded invocation ID";

/** A redelivery must reach the invocation that the first delivery started. */
const forwardedTo =
  (first: any): BodyCheck =>
  (json) =>
    forwarded(json) ??
    (first === undefined || json.forwarded === first.forwarded
      ? undefined
      : `forwarded to ${json.forwarded}, not to ${first.forwarded} as the first delivery`);

async function sendGitHub(url: string, secret: string) {
  const issue = 1000 + Math.floor(Math.random() * 9000);
  const comment = github.issueCommentCreated(issue, "Can reproduce on main.");
  const commentDelivery = github.newDeliveryId();

  await check(
    "github ping",
    url,
    github.sign(secret, "ping", github.newDeliveryId(), github.ping()),
    200,
    (json) => (json?.event === "ping" ? undefined : "not answered as a ping")
  );
  const first = await check(
    "github issue_comment",
    url,
    github.sign(secret, "issue_comment", commentDelivery, comment),
    200,
    forwarded
  );
  await check(
    "github issue_comment redelivered",
    url,
    github.sign(secret, "issue_comment", commentDelivery, comment),
    200,
    forwardedTo(first)
  );
  await check(
    "github pull_request opened",
    url,
    github.sign(
      secret,
      "pull_request",
      github.newDeliveryId(),
      github.pullRequestOpened(issue + 1)
    ),
    200,
    forwarded
  );
  await check(
    "github unhandled event ignored",
    url,
    github.sign(secret, "star", github.newDeliveryId(), { action: "created", repository: {} }),
    200,
    (json) => (json?.ignored === "star.created" ? undefined : "not ignored")
  );
  await check(
    "github bad signature rejected",
    url,
    github.sign(`${secret}-wrong`, "issue_comment", github.newDeliveryId(), comment),
    401
  );
}

async function sendLinear(url: string, secret: string) {
  const issueId = linear.newIssueId();
  const comment = linear.commentCreated(issueId, "Can reproduce on main.", Date.now());
  const commentDelivery = linear.newDeliveryId();
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

  await check(
    "linear issue created",
    url,
    linear.sign(secret, linear.newDeliveryId(), linear.issueCreated(issueId, Date.now())),
    200,
    forwarded
  );
  const first = await check(
    "linear comment created",
    url,
    linear.sign(secret, commentDelivery, comment),
    200,
    forwarded
  );
  await check(
    "linear comment redelivered",
    url,
    linear.sign(secret, commentDelivery, comment),
    200,
    forwardedTo(first)
  );
  await check(
    "linear bad signature rejected",
    url,
    linear.sign(`${secret}-wrong`, linear.newDeliveryId(), comment),
    401
  );
  await check(
    "linear stale webhookTimestamp rejected",
    url,
    linear.sign(
      secret,
      linear.newDeliveryId(),
      linear.commentCreated(issueId, "Late", tenMinutesAgo)
    ),
    401
  );
}

async function sendSlack(url: string, secret: string) {
  const now = () => Math.floor(Date.now() / 1000);
  const channel = `C${Math.floor(Math.random() * 1e9)}`;
  const challenge = slack.newChallenge();
  const mention = slack.appMention(slack.newEventId(), channel, "is the deploy done?");

  await check(
    "slack url_verification",
    url,
    slack.signJson(secret, slack.urlVerification(challenge), now()),
    200,
    (json) => (json?.challenge === challenge ? undefined : "challenge not echoed")
  );
  const first = await check(
    "slack app_mention",
    url,
    slack.signJson(secret, mention, now()),
    200,
    forwarded
  );
  // Slack retries an event it got no timely 2xx for, signed anew and with retry headers.
  const retry = slack.signJson(secret, mention, now());
  retry.headers["x-slack-retry-num"] = "1";
  retry.headers["x-slack-retry-reason"] = "http_timeout";
  await check("slack app_mention retried", url, retry, 200, forwardedTo(first));
  await check(
    "slack slash command",
    url,
    slack.signForm(
      secret,
      slack.slashCommand(slack.newTriggerId(), channel, "/deploy", "staging"),
      now()
    ),
    200,
    (json) =>
      json?.response_type === "ephemeral" && json?.text?.includes("/deploy staging")
        ? undefined
        : "no reply to the command"
  );
  await check(
    "slack bad signature rejected",
    url,
    slack.signJson(`${secret}-wrong`, mention, now()),
    401
  );
  await check(
    "slack stale timestamp rejected",
    url,
    slack.signJson(secret, mention, now() - 10 * 60),
    401
  );
}

const senders = [
  { name: "GitHub", url: "GITHUB_WEBHOOK_URL", secret: "GITHUB_WEBHOOK_SECRET", send: sendGitHub },
  { name: "Linear", url: "LINEAR_WEBHOOK_URL", secret: "LINEAR_WEBHOOK_SECRET", send: sendLinear },
  { name: "Slack", url: "SLACK_WEBHOOK_URL", secret: "SLACK_SIGNING_SECRET", send: sendSlack },
];

async function main() {
  const configured = senders.filter((sender) => process.env[sender.url]);
  if (configured.length === 0) {
    throw new Error(`Set at least one of ${senders.map((sender) => sender.url).join(", ")}`);
  }
  for (const sender of configured) {
    const secret = process.env[sender.secret];
    if (!secret) throw new Error(`${sender.url} is set, so set ${sender.secret} too`);
    console.log(`${sender.name} (${mode} mode)`);
    await sender.send(process.env[sender.url]!, secret);
  }
  if (failures > 0) {
    console.log(`${failures} check(s) failed`);
    process.exitCode = 1;
  }
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
