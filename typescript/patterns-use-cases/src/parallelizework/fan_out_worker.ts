import * as restate from "@restatedev/restate-sdk/lambda";
import { Context, CombineablePromise } from "@restatedev/restate-sdk";
import {aggregate, split, SubTask, Task} from "./utils";

/**
 * Restate makes it easy to parallelize async work by fanning out tasks.
 * Afterwards, you can collect the result by fanning in the partial results.
 * Durable Execution ensures that the fan-out and fan-in steps happen reliably exactly once.
 */
const fanOutWorker = restate.service({
    name: "worker",
    handlers: {
        run: async (ctx: Context, task: Task) => {
            // Split the task in subtasks
            const subtasks: SubTask[] = await ctx.run("split task", () =>
                split(task)
            );

            // Fan out the subtasks - run them in parallel
            const resultPromises = [];
            for (const subtask of subtasks) {
                const subResultPromise = ctx
                    .serviceClient(fanOutWorker)
                    .runSubtask(subtask);
                resultPromises.push(subResultPromise);
            }

            // Fan in - Aggregate the results
            const results = await CombineablePromise.all(resultPromises);
            return aggregate(results);
        },

        // Can also run on FaaS
        runSubtask: async (ctx: Context, subtask: SubTask) => {
            // Processing logic goes here ...
            // Can be moved to a separate service to scale independently
        },
    },
});

export const handler = restate.endpoint().bind(fanOutWorker).handler();
