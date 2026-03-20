from fastapi import HTTPException

from database.sql import LabRepository
from database.sql.repositories import NewLab

from ..app import app


@app.get("/api/v1/courses/{course_id}/labs", tags=["Лабораторные"])
def get_labs(course_id: int):
    lab_repository = LabRepository()
    labs = lab_repository.get_labs(course_id)

    labs_list = []

    for lab in labs:
        lab_id, number, title, task = lab
        labs_list.append({
            "id": lab_id,
            "number": number,
            "title": title,
            "task": task
        })

    return labs_list


@app.post("/api/v1/courses/{course_id}/labs", tags=["Лабораторные"])
def create_lab(course_id: int, payload: NewLab):
    lab_repository = LabRepository()
    lab_repository.create(payload, course_id)
    return {"success": True}


@app.put("/api/v1/labs/{lab_id}", tags=["Лабораторные"])
def update_lab(lab_id: int, payload: dict):
    lab_repository = LabRepository()
    success = lab_repository.update(
        lab_id,
        number=int(payload["number"]),
        title=str(payload["title"]),
        task=payload.get("task"),
    )
    if not success:
        raise HTTPException(status_code=404, detail="Lab not found")
    return {"success": True}


@app.get("/api/v1/labs/{lab_id}", tags=["Лабораторные"])
def get_lab(lab_id: int):
    lab_repository = LabRepository()
    row = lab_repository.get_by_id(lab_id)
    if not row:
        raise HTTPException(status_code=404, detail="Lab not found")
    _id, number, title, task, course_id = row
    return {"id": _id, "number": number, "title": title, "task": task, "course_id": course_id}


@app.delete("/api/v1/labs/{lab_id}", tags=["Лабораторные"])
def delete_lab(lab_id: int):
    lab_repository = LabRepository()
    success = lab_repository.delete(lab_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lab not found")
    return {"success": True}
