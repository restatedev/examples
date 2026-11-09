import * as restate from "@restatedev/restate-sdk";

// The objects in this example keep the events they processed, so you can see in the Restate UI or
// through their `history` handler that a redelivered event was processed once.

const HISTORY_LIMIT = 50;

export async function recordEvent<E>(ctx: restate.ObjectContext, event: E): Promise<void> {
  const history = (await ctx.get<E[]>("history")) ?? [];
  ctx.set("history", [...history, event].slice(-HISTORY_LIMIT));
}

export async function readHistory<E>(ctx: restate.ObjectSharedContext): Promise<E[]> {
  return (await ctx.get<E[]>("history")) ?? [];
}
