import assert from "node:assert/strict";
import { test } from "node:test";
import { TerminalError } from "@restatedev/restate-sdk";
import { readGitHubDelivery } from "./github";
import { asReceived, github, SignedRequest } from "./sample_deliveries";
import { hmacSha256Hex } from "./signing";

const SECRET = "github-test-secret";

const read = (request: SignedRequest) => readGitHubDelivery(...asReceived(request), SECRET);

const rejectedWith = (code: number) => (error: unknown) =>
  error instanceof TerminalError && error.code === code;

test("reads a ping", () => {
  const delivery = read(github.sign(SECRET, "ping", "d-1", github.ping()));
  assert.deepEqual(delivery, { kind: "ping", zen: "Design for failure." });
});

test("routes a new issue comment to its thread, with the delivery ID", () => {
  const payload = github.issueCommentCreated(42, "Can reproduce.");
  const delivery = read(github.sign(SECRET, "issue_comment", "d-2", payload));
  assert.deepEqual(delivery, {
    kind: "thread",
    thread: "acme/widgets#42",
    event: {
      deliveryId: "d-2",
      event: "issue_comment",
      action: "created",
      author: "octocat",
      text: "Can reproduce.",
      url: "https://github.com/acme/widgets/issues/42#issuecomment-1081119323",
    },
  });
});

test("routes a pull request event to the thread of the same number", () => {
  const delivery = read(github.sign(SECRET, "pull_request", "d-3", github.pullRequestOpened(43)));
  assert.equal(delivery.kind === "thread" && delivery.thread, "acme/widgets#43");
  assert.equal(delivery.kind === "thread" && delivery.event.action, "opened");
});

test("reads a form-encoded delivery", () => {
  const payload = github.issueCommentCreated(44, "Sent as a form");
  const delivery = read(github.sign(SECRET, "issue_comment", "d-4", payload, "form"));
  assert.equal(delivery.kind === "thread" && delivery.event.text, "Sent as a form");
});

test("ignores other events and actions", () => {
  const edited = { ...github.issueCommentCreated(42, "x"), action: "edited" };
  assert.deepEqual(read(github.sign(SECRET, "issue_comment", "d-5", edited)), {
    kind: "ignored",
    event: "issue_comment.edited",
  });
  assert.deepEqual(read(github.sign(SECRET, "push", "d-6", {})), {
    kind: "ignored",
    event: "push",
  });
});

test("rejects a delivery signed with another secret, or unsigned, with 401", () => {
  const request = github.sign("another-secret", "ping", "d-7", github.ping());
  assert.throws(() => read(request), rejectedWith(401));
  delete request.headers["x-hub-signature-256"];
  assert.throws(() => read(request), rejectedWith(401));
});

test("rejects a body changed after signing with 401", () => {
  const request = github.sign(SECRET, "issue_comment", "d-8", github.issueCommentCreated(42, "a"));
  request.body = request.body.replace('"body":"a"', '"body":"b"');
  assert.throws(() => read(request), rejectedWith(401));
});

test("rejects a signed but malformed delivery with 400", () => {
  const noDeliveryId = github.sign(SECRET, "ping", "d-9", github.ping());
  delete noDeliveryId.headers["x-github-delivery"];
  assert.throws(() => read(noDeliveryId), rejectedWith(400));

  const noIssue = { ...github.issueCommentCreated(42, "x"), issue: undefined };
  assert.throws(
    () => read(github.sign(SECRET, "issue_comment", "d-10", noIssue)),
    rejectedWith(400)
  );

  const notJson = github.sign(SECRET, "ping", "d-11", {});
  notJson.body = "{";
  notJson.headers["x-hub-signature-256"] = `sha256=${hmacSha256Hex(SECRET, ["{"])}`;
  assert.throws(() => read(notJson), rejectedWith(400));
});
