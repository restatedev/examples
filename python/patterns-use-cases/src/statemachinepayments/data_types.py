from pydantic import BaseModel


class Result(BaseModel):
    success: bool
    message: str
