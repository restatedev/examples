import * as restate from "@restatedev/restate-sdk";
import {CombineablePromise, Context} from "@restatedev/restate-sdk";
import {aggregate, executeSubtask, Result, split, SubTask, SubTaskResult, Task} from "./utils";

/*
 * Restate makes it easy to parallelize async work by fanning out tasks.
 * Afterward, you can collect the result by fanning in the partial results.
 *          +------------+
 *          | Split task |
 *          +------------+
 *                |
 *        ---------------------------------
 *        |                |              |
 * +--------------+ +--------------+ +--------------+
 * | Exec subtask | | Exec subtask | | Exec subtask |
 * +--------------+ +--------------+ +--------------+
 *        |                |               |
 *        ---------------------------------
 *                |
 *          +------------+
 *          | Aggregate  |
 *          +------------+
 * Durable Execution ensures that the fan-out and fan-in steps happen reliably exactly once.
 */

const fanOutWorker = restate.service({
    name: "worker",
    handlers: {
        run: async (ctx: Context, task: Task): Promise<Result> => {
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
            return aggregate(ctx, results);
        },

        // Can also run on FaaS
        runSubtask: async (ctx: Context, subtask: SubTask): Promise<SubTaskResult> => {
            // Processing logic goes here ...
            // Can be moved to a separate service to scale independently
            return executeSubtask(ctx, subtask);
        },
    },
});

restate.endpoint().bind(fanOutWorker).listen(9080);
