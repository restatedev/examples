import * as restate from "@restatedev/restate-sdk";

//  -----------------                                         -----------------
//                              Distributed Locks 
//  -----------------                                         -----------------
//
// Distributed locks are a powerful primitive that ensures shared resources are
// not accessed in parallel by multiple callers.
//
// Restate itself has great support to run code with exclusive access to some
// logical resources via keyed services (see the "single writer concurrency" pattern).
//
// But if actual distributed locks are required, it is fairly easy to create a
// robust implementation with Restate, as shown in this pattern.

export type TriedLockAcquisition = {
    acquired: boolean,
    fencingToken?: string,
}

const LOCK_HOLDER_STATE = "lock-holder";
const ACQUIRE_QUEUE_STATE = "lock-queue";

const lockService = {

    /**
     * Tries to acquire the lock with the given ID and returns a {@link TriedLockAcquisition}
     * to signal whether the acquisition succeeded, and (upon success) the associated
     * fencing token.
     */
    tryAcquire: async (ctx: restate.RpcContext, _lockId: string): Promise<TriedLockAcquisition> => {
        // the _lockId here is used by Restate as the key for this handler, and
        // all state is scoped to this. we don't use it explicitly in this function here
        const lockHolder = await ctx.get<string>(LOCK_HOLDER_STATE);
        if (lockHolder !== null) {
            return { acquired: false } as TriedLockAcquisition;
        }

        const fencingToken = ctx.rand.uuidv4();
        ctx.set(LOCK_HOLDER_STATE, fencingToken);
        return { acquired: true, fencingToken } as TriedLockAcquisition;
    },

    /**
     * Acquires the lock with the given ID, blocking until the lock could be acquired.
     * Returns the fencing token.
     */
    acquireBlocking: async (ctx: restate.RpcContext, lockId: string): Promise<string> => {
        const awakeable = ctx.awakeable<string>();
        ctx.send(lockServiceApi).acquireAsync(lockId, awakeable.id);
        return awakeable.promise;
    },

    /**
     * Acquires the lock with the given ID, asynchronously. Once the lock has been acquired,
     * completes the awakeable with the given ID with the lock's fencing token.
     */
    acquireAsync: async (ctx: restate.RpcContext, _lockId: string, awakeableId: string): Promise<void> => {
        // the lockId here is used by Restate as the key for this handler, and
        // all state is scoped to this. we don't use it explicitly in this function here

        // we call this method here synchronously (we can, because we keep the same key)
        const immediateAcquisition = await lockService.tryAcquire(ctx, _lockId);
        if (immediateAcquisition.acquired) {
            ctx.resolveAwakeable<string>(awakeableId, immediateAcquisition.fencingToken!);
            return;
        }

        const acquireQueue = (await ctx.get<string[]>(ACQUIRE_QUEUE_STATE)) ?? [];
        acquireQueue.push(awakeableId);
        ctx.set(ACQUIRE_QUEUE_STATE, acquireQueue);
    },

    /**
     * Checks whether the lock with the given ID is held by the given fencing token.
     */
    holdsLock: async (ctx: restate.RpcContext, _lockId: string, fencingToken: string): Promise<boolean> => {
        // the lockId here is used by Restate as the key for this handler, and
        // all state is scoped to this. we don't use it explicitly in this function here
        const lockHolder = await ctx.get<string>(LOCK_HOLDER_STATE);
        return lockHolder === fencingToken;
    },

    /**
     * Releases the lock with the given ID, if it is held with the given fencing token.
     */
    release: async (ctx: restate.RpcContext, _lockId: string, fencingToken: string): Promise<boolean> => {
        // the lockId here is used by Restate as the key for this handler, and
        // all state is scoped to this. we don't use it explicitly in this function here
        const lockHolder = await ctx.get<string>(LOCK_HOLDER_STATE);

        // check whether this token even holds the lock
        if (lockHolder !== fencingToken) {
            return false; // we didn't release on this request
        }

        // first, release this lock
        ctx.clear(LOCK_HOLDER_STATE);

        // now, process the next queued lock request, if there are any
        const acquireQueue = await ctx.get<string[]>(ACQUIRE_QUEUE_STATE) ?? [];
        const nextAwakeableId = acquireQueue.shift();
        if (nextAwakeableId !== undefined) {
            const fencingToken = ctx.rand.uuidv4();
            ctx.set(LOCK_HOLDER_STATE, fencingToken);
            ctx.resolveAwakeable<string>(nextAwakeableId, fencingToken);

            if (acquireQueue.length === 0) {
                ctx.clear(ACQUIRE_QUEUE_STATE);
            } else {
                ctx.set(ACQUIRE_QUEUE_STATE, acquireQueue);
            }
        }

        return true;
    }
}

export const lockServiceRouter = restate.keyedRouter(lockService);

/** Lock Service API type signature */
export type lockServiceType = typeof lockServiceRouter;

/** Lock Service RPC API */
export const lockServiceApi = { path: "_lock_service" } as restate.ServiceApi<lockServiceType>;
