from fastapi import HTTPException

from database.sql import TeacherRepository

from ..app import app
from ..models import Authentication, RegisterTeacherModel


@app.post("/teachers/auth", tags=["Преподаватели"])
async def teachers_auth(auth: Authentication):
    teacher_repository = TeacherRepository()

    teacher_id = teacher_repository.auth(auth.login, auth.password)

    return {"success": bool(teacher_id), "teacher_id": teacher_id}


@app.post("/teachers/register", tags=["Преподаватели"])
async def teachers_register(payload: RegisterTeacherModel):
    teacher_repository = TeacherRepository()

    if teacher_repository.is_login_already_used(payload.login):
        raise HTTPException(status_code=409, detail="Login already used")

    teacher_id = teacher_repository.create(
        login=payload.login,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )

    return {"success": True, "teacher_id": teacher_id}


@app.get("/teachers/{teacher_id}", tags=["Преподаватели"])
async def get_teacher_info(teacher_id: int):
    teacher_repository = TeacherRepository()

    first_name, last_name = teacher_repository.get_first_and_last_names(teacher_id)

    return {"first_name": first_name, "last_name": last_name}


@app.delete("/teachers/{teacher_id}", tags=["Преподаватели"])
async def delete_teacher(teacher_id: int):
    teacher_repository = TeacherRepository()
    success = teacher_repository.delete(teacher_id)
    if not success:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"success": True}
