import restate

from pydantic import BaseModel
from datetime import timedelta


class TaskOpts(BaseModel):
    id: str


async_task_worker = restate.Service("AsyncTaskWorker")


@async_task_worker.handler()
async def run(ctx: restate.Context, params: TaskOpts):
    # ... some heavy work ...
    return f"Finished work on task: {params.id}"


app = restate.app([async_task_worker])

if __name__ == "__main__":
    import hypercorn
    import asyncio

    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))
