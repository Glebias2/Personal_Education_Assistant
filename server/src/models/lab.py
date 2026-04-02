from pydantic import BaseModel


class NewLab(BaseModel):
    number: int
    title: str
    task: str
