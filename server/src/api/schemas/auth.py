from pydantic import BaseModel


class Authentication(BaseModel):
    login: str
    password: str


class RegisterTeacherModel(BaseModel):
    login: str
    password: str
    first_name: str
    last_name: str


class RegisterStudentModel(BaseModel):
    login: str
    password: str
    first_name: str
    last_name: str
    characteristic: str | None = None
    interests: list[str] = []
