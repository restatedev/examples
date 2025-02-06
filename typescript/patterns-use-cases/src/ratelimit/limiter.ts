// a faithful reimplementation of https://pkg.go.dev/golang.org/x/time/rate#Limiter
// using virtual object state

import { object, ObjectContext } from "@restatedev/restate-sdk";

type LimiterState = {
  state: LimiterStateInner;
};
type LimiterStateInner = {
  limit: number;
  burst: number;
  tokens: number;
  // last is the last time the limiter's tokens field was updated, in unix millis
  last: number;
  // lastEvent is the latest time of a rate-limited event (past or future), in unix millis
  lastEvent: number;
};

export interface Reservation {
  ok: boolean;
  tokens: number;
  creationDate: number;
  dateToAct: number;
  // This is the Limit at reservation time, it can change later.
  limit: number;
}

export const limiter = object({
  name: "limiter",
  handlers: {
    state: async (
      ctx: ObjectContext<LimiterState>,
    ): Promise<LimiterStateInner> => {
      return getState(ctx);
    },
    tokens: async (ctx: ObjectContext<LimiterState>): Promise<number> => {
      // deterministic date not needed, as there is only an output entry
      const tokens = advance(await getState(ctx), Date.now());
      return tokens;
    },
    reserve: async (
      ctx: ObjectContext<LimiterState>,
      {
        n = 1,
        waitLimitMillis = Infinity,
      }: { n?: number; waitLimitMillis?: number },
    ): Promise<Reservation> => {
      let lim = await getState(ctx);

      if (lim.limit == Infinity) {
        // deterministic date is not necessary, as this is part of a response body, which won't be replayed.
        const now = Date.now();
        return {
          ok: true,
          tokens: n,
          creationDate: now,
          dateToAct: now,
          limit: 0,
        };
      }

      let r: Reservation;
      ({ lim, r } = await ctx.run(() => {
        const now = Date.now();
        let tokens = advance(lim, now);

        // Calculate the remaining number of tokens resulting from the request.
        tokens -= n;

        // Calculate the wait duration
        let waitDurationMillis = 0;
        if (tokens < 0) {
          waitDurationMillis = durationFromTokens(lim.limit, -tokens);
        }

        // Decide result
        const ok = n <= lim.burst && waitDurationMillis <= waitLimitMillis;

        // Prepare reservation
        const r = {
          ok,
          tokens: 0,
          creationDate: now,
          dateToAct: 0,
          limit: lim.limit,
        } satisfies Reservation;

        if (ok) {
          r.tokens = n;
          r.dateToAct = now + waitDurationMillis;

          // Update state
          lim.last = now;
          lim.tokens = tokens;
          lim.lastEvent = r.dateToAct;
        }

        return { lim, r };
      }));

      setState(ctx, lim);

      return r;
    },
    setRate: async (
      ctx: ObjectContext<LimiterState>,
      { newLimit, newBurst }: { newLimit?: number; newBurst?: number },
    ) => {
      if (newLimit === undefined && newBurst === undefined) {
        return;
      }

      let lim = await getState(ctx);

      lim = await ctx.run(() => {
        const now = Date.now();
        const tokens = advance(lim, now);

        lim.last = now;
        lim.tokens = tokens;
        if (newLimit !== undefined) lim.limit = newLimit;
        if (newBurst !== undefined) lim.burst = newBurst;

        return lim;
      });

      setState(ctx, lim);
    },
    cancelReservation: async (
      ctx: ObjectContext<LimiterState>,
      r: Reservation,
    ) => {
      let lim = await getState(ctx);

      lim = await ctx.run(() => {
        const now = Date.now();

        if (lim.limit == Infinity || r.tokens == 0 || r.dateToAct < now) {
          return lim;
        }

        // calculate tokens to restore
        // The duration between lim.lastEvent and r.timeToAct tells us how many tokens were reserved
        // after r was obtained. These tokens should not be restored.
        const restoreTokens =
          r.tokens - tokensFromDuration(r.limit, lim.lastEvent - r.dateToAct);
        if (restoreTokens <= 0) {
          return lim;
        }
        // advance time to now
        let tokens = advance(lim, now);
        // calculate new number of tokens
        tokens += restoreTokens;
        if (tokens > lim.burst) {
          tokens = lim.burst;
        }
        // update state
        lim.last = now;
        lim.tokens = tokens;
        if (r.dateToAct == lim.lastEvent) {
          const prevEvent =
            r.dateToAct + durationFromTokens(r.limit, -r.tokens);
          if (prevEvent >= now) {
            lim.lastEvent = prevEvent;
          }
        }

        return lim;
      });

      setState(ctx, lim);
    },
  },
});

function advance(lim: LimiterStateInner, date: number): number {
  let last = lim.last;
  if (date <= last) {
    last = date;
  }

  // Calculate the new number of tokens, due to time that passed.
  const elapsedMillis = date - last;
  const delta = tokensFromDuration(lim.limit, elapsedMillis);
  let tokens = lim.tokens + delta;
  if (tokens > lim.burst) {
    tokens = lim.burst;
  }

  return tokens;
}

async function getState(
  ctx: ObjectContext<LimiterState>,
): Promise<LimiterStateInner> {
  return (
    (await ctx.get("state")) ?? {
      limit: 0,
      burst: 0,
      tokens: 0,
      last: 0,
      lastEvent: 0,
    }
  );
}

async function setState(
  ctx: ObjectContext<LimiterState>,
  lim: LimiterStateInner,
) {
  ctx.set("state", lim);
}

function durationFromTokens(limit: number, tokens: number): number {
  if (limit <= 0) {
    return Infinity;
  }

  return (tokens / limit) * 1000;
}

function tokensFromDuration(limit: number, durationMillis: number): number {
  if (limit <= 0) {
    return 0;
  }
  return (durationMillis / 1000) * limit;
}

export type Limiter = typeof limiter;
