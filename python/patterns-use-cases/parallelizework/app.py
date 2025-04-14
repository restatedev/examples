import restate

from utils import (
    Result,
    Task,
    split,
    execute_subtask,
    aggregate,
)

# Restate makes it easy to parallelize async work by fanning out tasks.
# Afterward, you can collect the result by fanning in the partial results.
#          +------------+
#          | Split task |
#          +------------+
#                |
#        ---------------------------------
#        |                |              |
# +--------------+ +--------------+ +--------------+
# | Exec subtask | | Exec subtask | | Exec subtask |
# +--------------+ +--------------+ +--------------+
#        |                |               |
#        ---------------------------------
#                |
#          +------------+
#          | Aggregate  |
#          +------------+
# Durable Execution ensures that the fan-out and fan-in steps happen reliably exactly once.
# Restate makes sure the completions are deterministic on replays.

fan_out_worker = restate.Service("FanOutWorker")


@fan_out_worker.handler()
async def run(ctx: restate.Context, task: Task) -> Result:
    # Split the task in subtasks
    subtasks = await ctx.run("split task", split, args=(task,))

    # Fan out the subtasks - run them in parallel
    result_promises = [
        ctx.run(f"execute {subtask}", execute_subtask, args=(subtask,))
        for subtask in subtasks.subtasks
    ]

    # Fan in - Aggregate the results
    results_done = await restate.gather(*result_promises)
    results = [await result for result in results_done]

    return aggregate(results)


app = restate.app([fan_out_worker])

if __name__ == "__main__":
    import hypercorn
    import asyncio

    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))
