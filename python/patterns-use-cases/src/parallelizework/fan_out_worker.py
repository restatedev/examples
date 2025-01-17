import restate
from restate import Service, Context

from utils import *

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

fanout_worker = Service("FanOutWorker")


@fanout_worker.handler()
async def run(ctx: Context, task: Task):
    # Split the task in subtasks
    subtasks = await ctx.run("split task", lambda: split(task))

    # Fan out the subtasks - run them in parallel
    result_promises = []
    for subtask in subtasks:
        sub_result_promise = ctx.service_call(run_subtask, arg=subtask)
        result_promises.append(sub_result_promise)

    # Fan in - Aggregate the results
    results = [await promise for promise in result_promises]
    return aggregate(results)


# Can also run on FaaS
@fanout_worker.handler()
async def run_subtask(ctx: Context, subtask: SubTask):
    # Processing logic goes here...
    # Can be moved to a separate service to scale independently
    return await execute_subtask(ctx, subtask)


app = restate.app([fanout_worker])
