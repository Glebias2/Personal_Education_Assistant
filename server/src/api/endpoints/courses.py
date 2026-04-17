from database.sql import CourseRepository, RecommendationRepository
from database.vector.repositories import StorageManager
from models.course import NewCourse

from ..app import app
from fastapi import HTTPException


@app.post("/api/v1/courses/create", tags=["Курсы"])
def create_course(request_form: NewCourse):
    course_repository = CourseRepository()
    course_id = course_repository.create(request_form)
    if request_form.tags:
        RecommendationRepository().set_course_tags(course_id, request_form.tags)
    return {"success": True, "course_id": course_id}


@app.get("/api/v1/courses", tags=["Курсы"])
def list_courses():
    course_repository = CourseRepository()
    rows = course_repository.list_all()
    tags_map = RecommendationRepository().get_all_course_tags()
    return [
        {
            "id": cid,
            "title": title,
            "teacher_id": teacher_id,
            "description": description,
            "difficulty": difficulty,
            "created_at": str(created_at) if created_at else None,
            "tags": tags_map.get(cid, []),
        }
        for (cid, title, teacher_id, description, difficulty, created_at) in rows
    ]


@app.get("/api/v1/students/{student_id}/courses", tags=["Курсы"])
def get_student_courses(student_id: int):
    course_repository = CourseRepository()
    rec_repository = RecommendationRepository()

    rows = course_repository.get_student_courses_detailed(student_id)
    tags_map = rec_repository.get_all_course_tags()

    result = []
    for (cid, title, description, difficulty, created_at, labs_completed, exam_completed) in rows:
        my_rating = rec_repository.get_course_rating(student_id=student_id, course_id=cid)
        result.append({
            "id": cid,
            "title": title,
            "description": description,
            "difficulty": difficulty,
            "created_at": created_at,
            "tags": tags_map.get(cid, []),
            "is_completed": bool(labs_completed) and bool(exam_completed),
            "my_rating": my_rating,
        })
    return result


@app.get("/api/v1/teachers/{teacher_id}/courses", tags=["Курсы"])
def get_teacher_courses(teacher_id: int):
    course_repository = CourseRepository()
    courses = course_repository.get_teacher_courses(teacher_id)
    return [{"id": course_id, "title": title} for (course_id, title) in courses]


@app.get("/api/v1/course/{course_id}/info", tags=["Курсы"])
def get_course_info(course_id: int):
    course_repository = CourseRepository()
    info = course_repository.get_course_info(course_id)
    tags = RecommendationRepository().get_course_tags(course_id)

    info_list = []
    for part in info:
        id, title, teacher_id, exam_questions, storage_id, description, difficulty, created_at = part
        info_list.append({
            "id": id,
            "title": title,
            "teacher_id": teacher_id,
            "exam_questions": exam_questions,
            "storage_id": storage_id,
            "description": description,
            "difficulty": difficulty,
            "created_at": str(created_at) if created_at else None,
            "tags": tags,
        })

    return info_list


@app.delete("/api/v1/course/{course_id}", tags=["Курсы"])
def delete_course(course_id: int):
    course_repository = CourseRepository()

    storage_id = course_repository.get_storage_id(course_id)
    if storage_id:
        try:
            StorageManager.delete_storage(storage_id)
        except ValueError:
            pass

    success = course_repository.delete(course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"success": True}


@app.put("/api/v1/course/{course_id}", tags=["Курсы"])
def update_course(course_id: int, payload: dict):
    course_repository = CourseRepository()
    success = course_repository.update(
        course_id,
        title=payload.get("title"),
        exam_questions=payload.get("exam_questions"),
        storage_id=int(payload["vector_storage_id"]) if payload.get("vector_storage_id") else None,
        description=payload.get("description"),
        difficulty=payload.get("difficulty"),
    )
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    if "tags" in payload:
        RecommendationRepository().set_course_tags(course_id, payload["tags"])
    return {"success": True}


@app.get("/api/v1/course/{course_id}/get_students", tags=["Курсы"])
def get_students_info(course_id: int):
    course_repository = CourseRepository()
    info = course_repository.get_students(course_id)
    return {"students": [{"id": id, "first_name": first_name, "last_name": last_name} for (id, first_name, last_name) in info]}


@app.get("/api/v1/courses/{course_id}/exam-questions", tags=["Курсы"])
async def get_exam_questions(course_id: int):
    course_repository = CourseRepository()
    exam_questions = course_repository.get_exam_questions(course_id)
    return {"exam_questions": exam_questions}
