import assert from "node:assert/strict";
import { test } from "node:test";
import { TerminalError } from "@restatedev/restate-sdk";
import { asReceived, slack, SignedRequest } from "./sample_deliveries";
import { readSlackRequest, SLACK_TIMESTAMP_TOLERANCE_S } from "./slack";

const SECRET = "slack-test-secret";
const NOW_S = 1_762_689_600;

const read = (request: SignedRequest, nowS = NOW_S) =>
  readSlackRequest(...asReceived(request), SECRET, nowS * 1000);

const rejectedWith = (code: number) => (error: unknown) =>
  error instanceof TerminalError && error.code === code;

test("reads the slash command from Slack's signing example", () => {
  // https://docs.slack.dev/authentication/verifying-requests-from-slack
  const body =
    "token=xyzz0WbapA4vBCDEFasx0q6G&team_id=T1DC2JH3J&team_domain=testteamnow&channel_id=G8PSS9T3V" +
    "&channel_name=foobar&user_id=U2CERLKJA&user_name=roadrunner&command=%2Fwebhook-collect&text=" +
    "&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT1DC2JH3J%2F397700885554%2F96rGlfmibIGlgcZRskXaIFfN" +
    "&trigger_id=398738663015.47445629121.803a0bc887a14d10d2c447fce8b6703c";
  const headers = new Map([
    ["content-type", "application/x-www-form-urlencoded"],
    ["x-slack-request-timestamp", "1531420618"],
    ["x-slack-signature", "v0=a2114d57b48eac39b9ad189dd8316235a7b4a8d21a10bd27519666489c69b503"],
  ]);
  const request = readSlackRequest(
    headers,
    new TextEncoder().encode(body),
    "8f742231b10e8888abcd99yyyzzz85a5",
    1531420618 * 1000
  );
  assert.deepEqual(request, {
    kind: "command",
    channel: "G8PSS9T3V",
    command: {
      triggerId: "398738663015.47445629121.803a0bc887a14d10d2c447fce8b6703c",
      user: "U2CERLKJA",
      command: "/webhook-collect",
      text: "",
      responseUrl:
        "https://hooks.slack.com/commands/T1DC2JH3J/397700885554/96rGlfmibIGlgcZRskXaIFfN",
    },
  });
});

test("reads a URL verification challenge", () => {
  const request = read(slack.signJson(SECRET, slack.urlVerification("c-1"), NOW_S));
  assert.deepEqual(request, { kind: "url_verification", challenge: "c-1" });
});

test("routes an app mention to its channel, with the event ID", () => {
  const payload = slack.appMention("Ev01", "C01", "is the deploy done?");
  assert.deepEqual(read(slack.signJson(SECRET, payload, NOW_S)), {
    kind: "mention",
    channel: "C01",
    mention: {
      eventId: "Ev01",
      user: "U0002ADA1",
      text: "<@U0001BOT1> is the deploy done?",
      ts: "1731170000.000100",
    },
  });
});

test("ignores other events, SSL checks and interactive payloads", () => {
  const reaction = { type: "event_callback", event_id: "Ev02", event: { type: "reaction_added" } };
  assert.deepEqual(read(slack.signJson(SECRET, reaction, NOW_S)), {
    kind: "ignored",
    event: "reaction_added",
  });
  assert.deepEqual(read(slack.signForm(SECRET, { ssl_check: "1", token: "t" }, NOW_S)), {
    kind: "ignored",
    event: "ssl_check",
  });
  assert.deepEqual(read(slack.signForm(SECRET, { payload: "{}" }, NOW_S)), {
    kind: "ignored",
    event: "interactivity",
  });
});

test("accepts a timestamp within five minutes, either side of now", () => {
  const request = slack.signJson(SECRET, slack.urlVerification("c-2"), NOW_S);
  assert.equal(read(request, NOW_S + SLACK_TIMESTAMP_TOLERANCE_S).kind, "url_verification");
  assert.equal(read(request, NOW_S - SLACK_TIMESTAMP_TOLERANCE_S).kind, "url_verification");
});

test("rejects a timestamp more than five minutes from now with 401", () => {
  const request = slack.signJson(SECRET, slack.urlVerification("c-3"), NOW_S);
  assert.throws(() => read(request, NOW_S + SLACK_TIMESTAMP_TOLERANCE_S + 1), rejectedWith(401));
  assert.throws(() => read(request, NOW_S - SLACK_TIMESTAMP_TOLERANCE_S - 1), rejectedWith(401));
});

test("rejects a request signed with another secret, unsigned, or re-timestamped, with 401", () => {
  const otherSecret = slack.signJson("another-secret", slack.urlVerification("c-4"), NOW_S);
  assert.throws(() => read(otherSecret), rejectedWith(401));

  const unsigned = slack.signJson(SECRET, slack.urlVerification("c-5"), NOW_S);
  delete unsigned.headers["x-slack-signature"];
  assert.throws(() => read(unsigned), rejectedWith(401));

  // The timestamp is signed: moving it into the window breaks the signature.
  const old = slack.signJson(SECRET, slack.urlVerification("c-6"), NOW_S - 3600);
  old.headers["x-slack-request-timestamp"] = String(NOW_S);
  assert.throws(() => read(old), rejectedWith(401));
});

test("rejects a signed form that is not a command or check with 400", () => {
  assert.throws(() => read(slack.signForm(SECRET, { text: "hi" }, NOW_S)), rejectedWith(400));
});
