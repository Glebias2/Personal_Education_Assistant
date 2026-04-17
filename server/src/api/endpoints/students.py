from fastapi import HTTPException

from database.sql import StudentRepository, RecommendationRepository, StudentPreferencesRepository

from ..app import app
from ..schemas.auth import Authentication, RegisterStudentModel, UpdatePreferencesModel


@app.post("/students/auth", tags=["Студенты"])
async def students_auth(auth: Authentication):
    student_repository = StudentRepository()
    student_id = student_repository.auth(auth.login, auth.password)
    return {"success": bool(student_id), "student_id": student_id}


@app.post("/students/register", tags=["Студенты"])
async def students_register(payload: RegisterStudentModel):
    student_repository = StudentRepository()

    if student_repository.is_login_already_used(payload.login):
        raise HTTPException(status_code=409, detail="Login already used")

    student_id = student_repository.create(
        login=payload.login,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        characteristic=payload.characteristic,
    )

    if payload.interests:
        RecommendationRepository().set_student_interests(student_id, payload.interests)

    return {"success": True, "student_id": student_id}


@app.get("/students/{student_id}", tags=["Студенты"])
async def get_student_info(student_id: int):
    student_repository = StudentRepository()
    row = student_repository.get_by_id(student_id)
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    _id, login, first_name, last_name, characteristic = row
    return {
        "id": _id,
        "login": login,
        "first_name": first_name,
        "last_name": last_name,
        "characteristic": characteristic,
    }


@app.delete("/students/{student_id}", tags=["Студенты"])
async def delete_student(student_id: int):
    student_repository = StudentRepository()
    success = student_repository.delete(student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"success": True}


@app.get("/students/{student_id}/preferences", tags=["Студенты"])
async def get_student_preferences(student_id: int):
    repo = StudentPreferencesRepository()
    prefs = repo.get_preferences(student_id)
    if prefs:
        return {
            "preferred_explanation_style": prefs["preferred_explanation_style"],
            "notes": prefs["notes"],
        }
    return {"preferred_explanation_style": None, "notes": None}


@app.put("/students/{student_id}/preferences", tags=["Студенты"])
async def update_student_preferences(student_id: int, payload: UpdatePreferencesModel):
    student_repository = StudentRepository()
    if not student_repository.get_by_id(student_id):
        raise HTTPException(status_code=404, detail="Student not found")
    repo = StudentPreferencesRepository()
    repo.update_preferences(student_id, payload.preferred_explanation_style, payload.notes)
    return {"success": True}
