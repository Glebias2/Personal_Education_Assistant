from pydantic import BaseModel


class AddReportModel(BaseModel):
    student_id: int
    lab_id: int
    url: str


class SetReportStatusModel(BaseModel):
    status: str
    comment: str | None = None
