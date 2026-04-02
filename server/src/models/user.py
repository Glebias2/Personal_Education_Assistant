from pydantic import BaseModel


class Student(BaseModel):
    login: str
    password: str
    first_name: str
    last_name: str
