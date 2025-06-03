import {
  endpoint,
  handlers,
  object,
  ObjectContext,
  ObjectSharedContext,
  TerminalError,
} from "@restatedev/restate-sdk";

interface CounterState {
  entries: Entry[];
}

type Entry = [/* bucket */ number, /* count */ number];

// here you determine how buckets are formed; in this case we have second-precision
function toBucket(unixMillis: number): number {
  return Math.floor(unixMillis / 1000);
}

// here you limit the amount of history that we keep; we don't want state to become arbitrarily large so we remove
// the oldest buckets once the total number of buckets exceeds this number
// 300 buckets with 1 second precision -> 5 minutes
// in theory as long as your state for a given key is < 1mB you can push this number much higher. it must be high
// enough to cover the oldest start time you want to count from
const MAX_BUCKETS = 300;

interface AddRequest {
  // the unix milli timestamp of the time of the event; optional, defaults to now
  timeMillis?: number;
}

type CountRequest =
  | {
      // the unix milli timestamp of the start of the period in which to count
      startMillis: number;

      // the unix milli timestamp of the end of the period in which to count; optional, defaults to including all entries
      // the end bucket is not included, so eg a 2000 milli period will mean two one-second buckets, not three
      endMillis?: number;
    }
  | {
      // how far in the past to count, in milliseconds
      periodMillis: number;
    };

const counter = object({
  name: "counter",
  handlers: {
    add: async (ctx: ObjectContext<CounterState>, request?: AddRequest) => {
      const bucket = toBucket(request?.timeMillis ?? (await ctx.date.now()));
      const entries = (await ctx.get("entries")) ?? [];

      // find the last entry that is lower or equal to the one we want
      // we start at the end because generally we'd expect the insertion time to be very recent (but we don't rely on this)
      const lastEntryIndex = entries.findLastIndex(
        (entry) => entry[0] <= bucket,
      );
      if (lastEntryIndex == -1) {
        // there are no lower or equal entries, this entry goes at the start
        entries.splice(0, 0, [bucket, 1]);
      } else if (entries[lastEntryIndex][0] == bucket) {
        // this bucket already exists; increment it
        entries[lastEntryIndex][1] += 1;
      } else {
        // this bucket does not exist; insert it
        entries.splice(lastEntryIndex + 1, 0, [bucket, 1]);
      }

      // maintain history limit
      if (entries.length > MAX_BUCKETS) {
        entries.splice(0, entries.length - MAX_BUCKETS);
      }

      ctx.set("entries", entries);
    },
    // by making this a shared handler we can handle a lot more read throughput, however it means the count is based on snapshot of this object,
    // so can be slightly out of date when there are concurrent calls to add. change it to a non-shared handler if thats a concern.
    count: handlers.object.shared(
      async (
        ctx: ObjectSharedContext<CounterState>,
        request: CountRequest,
      ): Promise<number> => {
        let startBucket: number;
        let endBucket: number | undefined;

        if (request && "startMillis" in request) {
          startBucket = toBucket(request.startMillis);
          endBucket = request.endMillis
            ? toBucket(request.endMillis)
            : undefined;
        } else if (request && "periodMillis" in request) {
          const now = await ctx.date.now();
          startBucket = toBucket(now - request.periodMillis);
          endBucket = undefined;
        } else {
          throw new TerminalError(
            "count requires at least a parameter 'startMillis' or 'periodMillis'",
          );
        }

        const entries = (await ctx.get("entries")) ?? [];

        // find the first entry that is greater than or equal to the start
        const startIndex =
          entries.findLastIndex((entry) => entry[0] < startBucket) + 1;

        // find the first entry that is greater than or equal to the end
        // the entry will not be included
        const endIndex = endBucket
          ? entries.findLastIndex((entry) => entry[0] < endBucket) + 1
          : entries.length;

        let count = 0;
        for (let i = startIndex; i < endIndex; i++) {
          count += entries[i][1];
        }

        return count;
      },
    ),
  },
});

endpoint().bind(counter).listen();
