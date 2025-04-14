import time
import logging

from pydantic import BaseModel
from random import randint

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s",
)
logger = logging.getLogger(__name__)


class Task(BaseModel):
    description: str


class SubTask(BaseModel):
    description: str


class SubTaskList(BaseModel):
    subtasks: list[SubTask]


class SubTaskResult(BaseModel):
    description: str


class Result(BaseModel):
    description: str


async def split(task: Task) -> SubTaskList:
    # Split the task into subTasks
    subtask_descriptions = task.description.split(",")
    sub_tasks = SubTaskList(
        subtasks=[
            SubTask(description=description) for description in subtask_descriptions
        ]
    )
    return sub_tasks


def execute_subtask(subtask: SubTask) -> SubTaskResult:
    # Execute subtask
    logging.info(f"Started executing subtask: {subtask.description}")
    # Sleep for a random amount between 0 and 10 seconds
    time.sleep(randint(0, 10))
    logging.info(f"Execution subtask finished: {subtask.description}")
    return SubTaskResult(description=f"{subtask}: DONE")


def aggregate(sub_results: list[SubTaskResult]) -> Result:
    # Aggregate the results
    descriptions = [sub_result.description for sub_result in sub_results]
    result_description = ",".join(descriptions)
    logging.info(f"Aggregated result: {result_description}")
    return Result(description=result_description)
