from pydantic import BaseModel


class NewReport(BaseModel):
    student_id: int
    lab_id: int
    url: str


class Report(BaseModel):
    text: str
    images: list
