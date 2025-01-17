from datetime import timedelta
from random import randint
from typing import List

from pydantic import BaseModel


class Task(BaseModel):
    description: str


class SubTask(BaseModel):
    description: str


class SubTaskResult(BaseModel):
    description: str


class Result(BaseModel):
    description: str


def split(task: Task) -> List[SubTask]:
    # Split the task into subTasks
    subtask_descriptions = task.description.split(",")
    sub_tasks = [SubTask(description=description) for description in subtask_descriptions]
    return sub_tasks


async def execute_subtask(ctx, subtask: SubTask) -> SubTaskResult:
    # Execute subtask
    print(f"Started executing subtask: {subtask.description}")
    # Sleep for a random amount between 0 and 10 seconds
    sleep_duration = await ctx.run("get sleep duration", lambda: randint(0, 10))
    await ctx.sleep(timedelta(milliseconds=sleep_duration))
    print(f"Execution subtask finished: {subtask.description}")
    return SubTaskResult(description=f"{subtask.description}: DONE")


def aggregate(sub_results: List[SubTaskResult]) -> Result:
    # Aggregate the results
    descriptions = [sub_result.description for sub_result in sub_results]
    result_description = ",".join(descriptions)
    print(f"Aggregated result: {result_description}")
    return Result(description=result_description)
