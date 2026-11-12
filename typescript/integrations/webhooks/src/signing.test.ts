import assert from "node:assert/strict";
import { test } from "node:test";
import { hmacMatches, hmacSha256Hex } from "./signing";

// Test vectors published by the senders, so these tests do not just check the code against itself.

test("matches GitHub's published test vector", () => {
  // https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries#testing-the-webhook-payload-validation
  const secret = "It's a Secret to Everybody";
  const expected = "757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17";
  assert.equal(hmacSha256Hex(secret, ["Hello, World!"]), expected);
  assert.ok(hmacMatches(secret, [new TextEncoder().encode("Hello, World!")], expected));
});

test("matches Slack's published example", () => {
  // https://docs.slack.dev/authentication/verifying-requests-from-slack
  const body =
    "token=xyzz0WbapA4vBCDEFasx0q6G&team_id=T1DC2JH3J&team_domain=testteamnow&channel_id=G8PSS9T3V" +
    "&channel_name=foobar&user_id=U2CERLKJA&user_name=roadrunner&command=%2Fwebhook-collect&text=" +
    "&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT1DC2JH3J%2F397700885554%2F96rGlfmibIGlgcZRskXaIFfN" +
    "&trigger_id=398738663015.47445629121.803a0bc887a14d10d2c447fce8b6703c";
  const expected = "a2114d57b48eac39b9ad189dd8316235a7b4a8d21a10bd27519666489c69b503";
  assert.ok(hmacMatches("8f742231b10e8888abcd99yyyzzz85a5", ["v0:1531420618:", body], expected));
});

test("rejects a wrong, truncated, non-hex or missing signature", () => {
  const signature = hmacSha256Hex("secret", ["body"]);
  assert.ok(hmacMatches("secret", ["body"], signature));
  assert.ok(!hmacMatches("other secret", ["body"], signature));
  assert.ok(!hmacMatches("secret", ["body!"], signature));
  assert.ok(!hmacMatches("secret", ["body"], signature.slice(0, 62)));
  assert.ok(!hmacMatches("secret", ["body"], "z".repeat(64)));
  assert.ok(!hmacMatches("secret", ["body"], undefined));
});
