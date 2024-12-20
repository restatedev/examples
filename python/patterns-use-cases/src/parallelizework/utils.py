from pydantic import BaseModel

class Task(BaseModel):
    task_id: str


class Subtask(BaseModel):
    task_id: str
    subtask_id: str



def split(task) -> list[Subtask]:
    return list()


def aggregate(results) -> list[Task]:
    return list()
