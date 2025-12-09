import { Context, TerminalError } from "@restatedev/restate-sdk";
import type { Semaphore } from "./semaphore";

const semaphore: Semaphore = { name: "semaphore" };

/**
 * Configuration options for concurrency limiting in handlers.
 */
export interface LimitOptions<I> {
  /**
   * A unique identifier for this handler.
   * Used when `scope` is set to `"handler"` to distinguish between different handlers.
   */
  id: string;

  /**
   * A list of concurrency limiters to apply to this handler.
   *
   * Permits are acquired in reverse order (last to first), so limits should be arranged
   * in roughly descending order of specificity.
   *
   * @remarks
   * Multiple limiters allow for hierarchical rate limiting, such as per-user limits
   * within broader global limits.
   */
  concurrency: {
    /**
     * The scope to apply the concurrency limit to.
     *
     * - `"handler"`: Limit applies only to handlers with the same `id` and `key`
     * - `"global"`: Limit applies globally across all handlers for the given `key`
     *
     * @defaultValue "handler"
     */
    scope?: "handler" | "global";

    /**
     * The key used to identify and group concurrent operations.
     *
     * Can be either:
     * - A static string (e.g., `"default"`)
     * - A function that extracts a string from the input (e.g., `(input) => input.userId`)
     */
    key: string | ((input: I) => string);

    /**
     * The maximum number of concurrent operations allowed for this key within the specified scope.
     *
     * When the limit is reached, additional requests will be queued.
     */
    limit: number;
  }[];
}

export function limitHandler<C extends Context, O, I>(
  options: LimitOptions<I>,
  fn: (ctx: C, input: I) => Promise<O>
): typeof fn {
  return (async (ctx: C, input: I) => {
    const permits: { key: string }[] = [];

    const releaseAll = () => {
      for (let i = permits.length - 1; i >= 0; i--) {
        const client = ctx.objectSendClient(semaphore, permits[i].key);

        client.release();
      }
    };

    for (let i = options.concurrency.length - 1; i >= 0; i--) {
      const limit = options.concurrency[i];

      const limitKey =
        typeof limit.key === "string" ? limit.key : limit.key(input);

      const scopedKey =
        limit.scope == "global"
          ? `global|${limitKey}`
          : `${options.id}|${limitKey}`;

      const client = ctx.objectSendClient(semaphore, scopedKey);

      const awakeable = ctx.awakeable();
      client.acquire({
        awakeable: awakeable.id,
        limit: limit.limit,
      });

      try {
        await awakeable.promise;
        permits.push({ key: scopedKey });
      } catch (e) {
        // this should only happen on cancellation; inform the semaphore that we no longer need our permit, and release the ones we already have
        if (e instanceof TerminalError) {
          client.release({ awakeable: awakeable.id });
          releaseAll();
        }

        throw e;
      }
    }

    try {
      const output = await fn(ctx, input);

      releaseAll();

      return output;
    } catch (e) {
      if (e instanceof TerminalError) {
        releaseAll();
      }

      throw e;
    }
  }) as typeof fn;
}
