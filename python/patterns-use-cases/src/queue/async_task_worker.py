import restate
from pydantic import BaseModel
from restate import Service, Context


class TaskOpts(BaseModel):
    id: str


async_task_worker = Service("AsyncTaskWorker")


@async_task_worker.handler()
async def run(ctx: Context, params: TaskOpts):
    # ... some heavy work ...
    return f"Finished work on task: {params.id}"


app = restate.app([async_task_worker])
