# You can remove this file.
# It's only purpose is providing pydantic models for the template.
from pydantic import BaseModel


# You can also just use a typed dict, without Pydantic
class GreetingRequest(BaseModel):
    name: str


class Greeting(BaseModel):
    message: str
