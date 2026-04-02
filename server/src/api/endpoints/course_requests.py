from fastapi import HTTPException

from database.sql import CourseRepository

from ..app import app


@app.post("/api/v1/courses/{course_id}/requests", tags=["Курсы"])
def create_course_request(course_id: int, payload: dict):
    student_id = payload.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id is required")

    course_repository = CourseRepository()
    request_id = course_repository.create_course_request(student_id=int(student_id), course_id=course_id)
    return {"success": True, "request_id": request_id}


@app.get("/api/v1/courses/{course_id}/requests", tags=["Курсы"])
def get_course_requests(course_id: int):
    course_repository = CourseRepository()
    rows = course_repository.get_course_requests(course_id)
    return {
        "requests": [
            {
                "id": rid,
                "student_id": student_id,
                "course_id": cid,
                "status": status,
                "created_at": created_at,
                "first_name": first_name,
                "last_name": last_name,
            }
            for (rid, student_id, cid, status, created_at, first_name, last_name) in rows
        ]
    }


@app.post("/api/v1/course-requests/{request_id}/approve", tags=["Курсы"])
def approve_course_request(request_id: int):
    course_repository = CourseRepository()

    row = course_repository.get_course_request_by_id(request_id)
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    student_id, course_id, status = row

    course_repository.enroll_student(student_id=student_id, course_id=course_id)
    course_repository.set_course_request_status(request_id, "approved")
    return {"success": True}


@app.post("/api/v1/course-requests/{request_id}/reject", tags=["Курсы"])
def reject_course_request(request_id: int):
    course_repository = CourseRepository()
    ok = course_repository.set_course_request_status(request_id, "rejected")
    if not ok:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"success": True}
