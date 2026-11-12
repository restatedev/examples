import * as restate from "@restatedev/restate-sdk";

// Webhook handlers throw TerminalErrors for requests they will never accept. Restate does not retry
// a TerminalError, and in sync mode the sender gets its code as the HTTP status. Any other error
// makes Restate retry the handler, which is right for an outage and wrong for a bad request.

export const unauthorized = (message: string) =>
  new restate.TerminalError(message, { errorCode: 401 });

export const badRequest = (message: string) =>
  new restate.TerminalError(message, { errorCode: 400 });

/** A header's value. Restate passes header names in lower case. */
export function requireHeader(headers: ReadonlyMap<string, string>, name: string): string {
  const value = headers.get(name);
  if (value === undefined || value === "") throw badRequest(`Missing header ${name}`);
  return value;
}

/** `value`, or a 400 naming the payload field it should have come from. */
export function requireField<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null) throw badRequest(`Missing field ${name}`);
  return value;
}

/** `text` as a JSON object. Callers cast it to an interface of optional fields they then check. */
export function parseJsonObject(text: string): object {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw badRequest("Body is not JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw badRequest("Body is not a JSON object");
  }
  return parsed;
}

export const bodyText = (body: Uint8Array) => new TextDecoder().decode(body);

/**
 * A signing secret from the environment. Unset, every delivery fails with a 500 that names the
 * variable, so a misconfigured deployment shows up in the sender's delivery log and in the
 * Restate UI instead of silently accepting unsigned requests.
 */
export function secretFromEnv(name: string): string {
  const secret = process.env[name];
  if (!secret) throw new restate.TerminalError(`${name} is not set`, { errorCode: 500 });
  return secret;
}

/**
 * The idempotency key for the work a delivery starts. Senders retry, and send the same delivery
 * ID each time: Restate runs the work once per key and returns the first invocation's ID to the
 * others.
 */
export const idempotencyKey = (sender: string, deliveryId: string) =>
  `webhook:${sender}:${deliveryId}`;
