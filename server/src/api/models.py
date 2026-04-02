from pydantic import BaseModel


class Authentication(BaseModel):
    login: str
    password: str


class AddReportModel(BaseModel):
    student_id: int
    lab_id: int
    url: str


class RegisterTeacherModel(BaseModel):
    # NEW FUNCTIONALITY: регистрация преподавателя
    login: str
    password: str
    first_name: str
    last_name: str


class RegisterStudentModel(BaseModel):
    # NEW FUNCTIONALITY: регистрация студента
    login: str
    password: str
    first_name: str
    last_name: str
    characteristic: str | None = None
    interests: list[str] = []


class SetReportStatusModel(BaseModel):
    # NEW FUNCTIONALITY: смена статуса отчёта
    status: str
    comment: str | None = None


class RateCourseModel(BaseModel):
    student_id: int
    rating: int  # 1-5
