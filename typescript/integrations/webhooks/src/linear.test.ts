import assert from "node:assert/strict";
import { test } from "node:test";
import { TerminalError } from "@restatedev/restate-sdk";
import { LINEAR_TIMESTAMP_TOLERANCE_MS, readLinearDelivery } from "./linear";
import { asReceived, linear, SignedRequest } from "./sample_deliveries";

const SECRET = "linear-test-secret";
const NOW = Date.parse("2026-11-09T12:00:00Z");
const ISSUE_ID = "8d5b3e5c-6f0a-4b8e-9a63-1c2d3e4f5a6b";

const read = (request: SignedRequest, nowMs = NOW) =>
  readLinearDelivery(...asReceived(request), SECRET, nowMs);

const rejectedWith = (code: number) => (error: unknown) =>
  error instanceof TerminalError && error.code === code;

test("routes a new issue to itself, with the delivery ID", () => {
  const delivery = read(linear.sign(SECRET, "d-1", linear.issueCreated(ISSUE_ID, NOW)));
  assert.deepEqual(delivery, {
    kind: "issue",
    issueId: ISSUE_ID,
    event: {
      deliveryId: "d-1",
      event: "issue_created",
      author: "Ada Lovelace",
      text: "Deliveries time out under load",
      url: "https://linear.app/acme/issue/ENG-123/deliveries-time-out-under-load",
    },
  });
});

test("routes a new comment to its issue", () => {
  const payload = linear.commentCreated(ISSUE_ID, "Can reproduce.", NOW);
  const delivery = read(linear.sign(SECRET, "d-2", payload));
  assert.equal(delivery.kind === "issue" && delivery.issueId, ISSUE_ID);
  assert.equal(delivery.kind === "issue" && delivery.event.event, "comment_created");
  assert.equal(delivery.kind === "issue" && delivery.event.text, "Can reproduce.");
});

test("ignores other entities and actions", () => {
  const updated = { ...linear.issueCreated(ISSUE_ID, NOW), action: "update" };
  assert.deepEqual(read(linear.sign(SECRET, "d-3", updated)), {
    kind: "ignored",
    event: "Issue.update",
  });
});

test("accepts a webhookTimestamp within the window, either side of now", () => {
  const payload = linear.issueCreated(ISSUE_ID, NOW);
  const request = linear.sign(SECRET, "d-4", payload);
  assert.equal(read(request, NOW + LINEAR_TIMESTAMP_TOLERANCE_MS).kind, "issue");
  assert.equal(read(request, NOW - LINEAR_TIMESTAMP_TOLERANCE_MS).kind, "issue");
});

test("rejects a webhookTimestamp outside the window with 401", () => {
  const request = linear.sign(SECRET, "d-5", linear.issueCreated(ISSUE_ID, NOW));
  assert.throws(() => read(request, NOW + LINEAR_TIMESTAMP_TOLERANCE_MS + 1), rejectedWith(401));
  assert.throws(() => read(request, NOW - LINEAR_TIMESTAMP_TOLERANCE_MS - 1), rejectedWith(401));
});

test("rejects a delivery signed with another secret, or unsigned, with 401", () => {
  const request = linear.sign("another-secret", "d-6", linear.issueCreated(ISSUE_ID, NOW));
  assert.throws(() => read(request), rejectedWith(401));
  delete request.headers["linear-signature"];
  assert.throws(() => read(request), rejectedWith(401));
});

test("rejects a signed delivery without Linear-Delivery or data with 400", () => {
  const noDeliveryId = linear.sign(SECRET, "d-7", linear.issueCreated(ISSUE_ID, NOW));
  delete noDeliveryId.headers["linear-delivery"];
  assert.throws(() => read(noDeliveryId), rejectedWith(400));

  const noData = { ...linear.issueCreated(ISSUE_ID, NOW), data: undefined };
  assert.throws(() => read(linear.sign(SECRET, "d-8", noData)), rejectedWith(400));
});
