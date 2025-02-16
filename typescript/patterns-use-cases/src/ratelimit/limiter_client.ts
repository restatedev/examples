import { Context, TerminalError } from "@restatedev/restate-sdk";
import type {
  Limiter as LimiterObject,
  Reservation as ReservationResponse,
} from "./limiter";

export interface Reservation extends ReservationResponse {
  // cancel indicates that the reservation holder will not perform the reserved action
  // and reverses the effects of this Reservation on the rate limit as much as possible,
  // considering that other reservations may have already been made.
  cancel(): void;
}

export interface Limiter {
  // limit returns the maximum overall event rate.
  limit(): Promise<number>;
  // burst returns the maximum burst size. Burst is the maximum number of tokens
  // that can be consumed in a single call to allow, reserve, or wait, so higher
  // Burst values allow more events to happen at once.
  // A zero Burst allows no events, unless limit == Inf.
  burst(): Promise<number>;
  // tokens returns the number of tokens available at time t (defaults to now).
  tokens(): Promise<number>;
  // allow reports whether n events may happen at time t.
  // Use this method if you intend to drop / skip events that exceed the rate limit.
  // Otherwise use reserve or wait.
  allow(n?: number): Promise<boolean>;
  // reserve returns a Reservation that indicates how long the caller must wait before n events happen.
  // The limiter takes this Reservation into account when allowing future events.
  // The returned Reservation’s ok parameter is false if n exceeds the limiter's burst size, or provided waitLimitMillis.
  // Use this method if you wish to wait and slow down in accordance with the rate limit without dropping events.
  // If you need to cancel the delay, use wait instead.
  // To drop or skip events exceeding rate limit, use allow instead.
  reserve(n?: number, waitLimitMillis?: number): Promise<Reservation>;
  // setLimit sets a new limit for the limiter. The new limit, and burst, may be violated
  // or underutilized by those which reserved (using reserve or wait) but did not yet act
  // before setLimit was called.
  setLimit(newLimit: number): Promise<void>;
  // setBurst sets a new burst size for the limiter.
  setBurst(newBurst: number): Promise<void>;
  // setRate sets a new limit and burst size for the limiter.
  setRate(newLimit: number, newBurst: number): Promise<void>;
  // waitN blocks until the limiter permits n events to happen.
  // It returns an error if n exceeds the limiter's burst size, the invocation is canceled,
  // or the wait would be longer than the deadline.
  // The burst limit is ignored if the rate limit is Inf.
  wait(n?: number, waitLimitMillis?: number): Promise<void>;
}

export namespace Limiter {
  export function fromContext(ctx: Context, limiterID: string): Limiter {
    const client = ctx.objectClient<LimiterObject>(
      { name: "limiter" },
      limiterID,
    );
    return {
      async limit() {
        return (await client.state()).limit;
      },
      async burst() {
        return (await client.state()).burst;
      },
      async tokens() {
        return client.tokens();
      },
      async allow(n?: number) {
        const r = await client.reserve({
          n,
          waitLimitMillis: 0,
        });
        return r.ok;
      },
      async reserve(n?: number, waitLimitMillis?: number) {
        const r = await client.reserve({
          n,
          waitLimitMillis,
        });
        return {
          cancel() {
            ctx
              .objectSendClient<LimiterObject>({ name: "limiter" }, limiterID)
              .cancelReservation(r);
          },
          ...r,
        };
      },
      async setLimit(newLimit: number) {
        return client.setRate({
          newLimit,
        });
      },
      async setBurst(newBurst: number) {
        return client.setRate({
          newBurst,
        });
      },
      async setRate(newLimit: number, newBurst: number) {
        return client.setRate({
          newLimit,
          newBurst,
        });
      },
      async wait(n: number = 1, waitLimitMillis?: number) {
        // Reserve
        const r = await this.reserve(n, waitLimitMillis);
        if (!r.ok) {
          if (waitLimitMillis === undefined) {
            throw new TerminalError(
              `rate: Wait(n=${n}) would exceed the limiters burst`,
              { errorCode: 429 },
            );
          } else {
            throw new TerminalError(
              `rate: Wait(n=${n}) would either exceed the limiters burst or the provided waitLimitMillis`,
              { errorCode: 429 },
            );
          }
        }
        // Wait if necessary
        const delay = delayFrom(r, r.creationDate);
        if (delay == 0) {
          return;
        }

        try {
          await ctx.sleep(delay);
        } catch (e) {
          // this only happens on invocation cancellation - cancel the reservation in the background
          r.cancel();
          throw e;
        }
      },
    };
  }
}

// delayFrom returns the duration in millis for which the reservation holder must wait
// before taking the reserved action.  Zero duration means act immediately.
// Infinity means the limiter cannot grant the tokens requested in this
// Reservation within the maximum wait time.
function delayFrom(r: ReservationResponse, date: number): number {
  if (!r.ok) {
    return Infinity;
  }
  const delay = r.dateToAct - date;
  if (delay < 0) {
    return 0;
  }
  return Math.floor(delay);
}
