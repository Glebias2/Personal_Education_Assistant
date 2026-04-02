from pydantic import BaseModel


class Course(BaseModel):
    title: str
    exam_questions: str


class NewCourse(BaseModel):
    title: str
    teacher_id: str
    exam_questions: str
    description: str | None = None
    difficulty: str = "intermediate"
    tags: list[str] = []
