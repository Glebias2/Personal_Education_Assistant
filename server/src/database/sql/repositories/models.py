from enum import Enum
from pydantic import BaseModel


class ReportStatus(Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    NOT_APPROVED = 'not-approved'


class Student(BaseModel):
    login: str
    password: str
    first_name: str
    last_name: str


class Course(BaseModel):
    title: str
    exam_questions: str


class NewReport(BaseModel):
    student_id: int
    lab_id: int
    url: str


class NewCourse(BaseModel):
    title: str
    teacher_id: str
    exam_questions: str


class NewLab(BaseModel):
    number: int
    title: str
    task: str
