import { object, ObjectContext } from "@restatedev/restate-sdk";

interface SemaphoreState {
  waiters: { awakeable: string }[];
  count: number;
  limit: number | null;
}

interface ReleaseRequest {
  awakeable?: string;
}

interface AcquireRequest {
  awakeable: string;
  limit: number;
}

export const semaphore = object({
  name: "semaphore",
  handlers: {
    release: async (
      ctx: ObjectContext<SemaphoreState>,
      request?: ReleaseRequest
    ): Promise<void> => {
      const state = await getState(ctx);

      const index = request?.awakeable
        ? state.waiters.findIndex(
            (waiter) => waiter.awakeable == request.awakeable
          )
        : -1;

      if (index == -1) {
        // no awakeable provided, or the one that was provided isn't in the waiter list
        state.count = Math.max(0, state.count - 1);
      } else {
        // remove waiter from the list
        state.waiters.splice(index, 1);
      }

      tick(ctx, state);

      setState(ctx, state);
    },
    acquire: async (
      ctx: ObjectContext<SemaphoreState>,
      request: AcquireRequest
    ): Promise<void> => {
      const state = await getState(ctx);

      state.limit = request.limit;

      state.waiters.push({ awakeable: request.awakeable });

      tick(ctx, state);

      setState(ctx, state);
    },
  },
});

async function getState(
  ctx: ObjectContext<SemaphoreState>
): Promise<SemaphoreState> {
  return {
    waiters: (await ctx.get("waiters")) ?? [],
    count: (await ctx.get("count")) ?? 0,
    limit: await ctx.get("limit"),
  };
}

function setState(ctx: ObjectContext<SemaphoreState>, state: SemaphoreState) {
  ctx.set("waiters", state.waiters);
  ctx.set("count", state.count);
  ctx.set("limit", state.limit);
}

function tick(ctx: ObjectContext<SemaphoreState>, state: SemaphoreState) {
  while (state.count < (state.limit ?? 0) && state.waiters.length > 0) {
    let waiter = state.waiters.shift()!;
    state.count++;
    ctx.resolveAwakeable(waiter.awakeable);
  }

  ctx.console.log(
    `Tick end. Count: ${state.count}, Limits: ${state.limit}, Waiters: ${state.waiters.length}`
  );
}

export type Semaphore = typeof semaphore;
