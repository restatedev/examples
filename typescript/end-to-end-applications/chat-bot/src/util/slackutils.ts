import { verifySlackRequest } from "@slack/bolt";
import { TerminalError } from "@restatedev/restate-sdk";

export type MessageType = "url_verification" | "event_callback";

export type SlackMessage = {
  type: MessageType;
  event: {
    text: string;
    channel: string;
    user: string;
  };
  event_id: string;
  challenge?: string;
};

export function filterIrrelevantMessages(msg: SlackMessage, slackBotUser: string): boolean {
  // ignore anything that is not an event callback
  if (msg.type !== "event_callback" || !msg.event) {
    return true;
  }

  // ignore messages from ourselves
  if (msg.event.user === slackBotUser) {
    return true;
  }

  // ignore messages that are not raw but updates
  if (msg.event.user === undefined || msg.event.text === undefined) {
    return true;
  }

  return false;
}

export function verifySignature(
  body: Uint8Array,
  headers: ReadonlyMap<string, string>,
  signingSecret: string,
) {
  const requestSignature = headers.get("x-slack-signature");
  const tsHeader = headers.get("x-slack-request-timestamp");

  if (!requestSignature) {
    throw new TerminalError("Header 'x-slack-signature' missing", { errorCode: 400 });
  }
  if (!tsHeader) {
    throw new TerminalError("Header 'x-slack-request-timestamp' missing", { errorCode: 400 });
  }

  let requestTimestamp;
  try {
    requestTimestamp = Number(tsHeader);
  } catch (e) {
    throw new TerminalError("Cannot parse header 'x-slack-request-timestamp': " + tsHeader, {
      errorCode: 400,
    });
  }

  try {
    verifySlackRequest({
      signingSecret,
      headers: {
        "x-slack-signature": requestSignature,
        "x-slack-request-timestamp": requestTimestamp,
      },
      body: Buffer.from(body).toString("utf-8"),
    });
  } catch (e) {
    throw new TerminalError("Event signature verification failed", { errorCode: 400 });
  }
}
