from fastapi import HTTPException

from database.sql import RecommendationRepository
from constants import PREDEFINED_TAGS
from recommendations import RecommendationService

from ..app import app
from ..schemas.recommendations import RateCourseModel


@app.get("/api/v1/tags", tags=["Рекомендации"])
def get_available_tags():
    return {"tags": PREDEFINED_TAGS}


@app.get("/api/v1/students/{student_id}/recommended-courses", tags=["Рекомендации"])
def get_recommended_courses(student_id: int):
    repo = RecommendationRepository()
    service = RecommendationService()

    # Проверяем наличие интересов у студента
    interests = repo.get_student_interests(student_id)

    # Получаем ранжированные курсы через новый сервис (7 сигналов)
    courses = service.get_ranked_courses(student_id)

    # Определяем, можем ли рекомендовать (нужны интересы + значимый score)
    has_recommendations = False
    recommended = []
    other = courses

    if interests and courses:
        top = courses[:3]
        # Рекомендуем только если у лидера score > 0.25 и есть совпадение по тегам
        if top and top[0]["score"] > 0.25 and top[0].get("tag_match", 0) > 0:
            has_recommendations = True
            recommended = top
            other = courses[3:]

    # Один дополнительный курс по чистому score, не попавший в top-3
    # Работает даже когда has_recommendations=False — тогда other=все курсы
    maybe_like = other[0] if other else None

    return {
        "recommended": recommended,
        "other": other,
        "has_recommendations": has_recommendations,
        "maybe_like": maybe_like,
    }


@app.get("/api/v1/students/{student_id}/interests", tags=["Рекомендации"])
def get_student_interests(student_id: int):
    repo = RecommendationRepository()
    interests = repo.get_student_interests(student_id)
    return {"interests": interests}


@app.put("/api/v1/students/{student_id}/interests", tags=["Рекомендации"])
def update_student_interests(student_id: int, payload: dict):
    interests = payload.get("interests", [])
    # Валидация: только предопределённые теги
    invalid = [t for t in interests if t not in PREDEFINED_TAGS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Неизвестные теги: {invalid}")

    repo = RecommendationRepository()
    repo.set_student_interests(student_id, interests)
    return {"success": True}


@app.get("/api/v1/courses/{course_id}/tags", tags=["Рекомендации"])
def get_course_tags(course_id: int):
    repo = RecommendationRepository()
    tags = repo.get_course_tags(course_id)
    return {"tags": tags}


@app.put("/api/v1/courses/{course_id}/tags", tags=["Рекомендации"])
def update_course_tags(course_id: int, payload: dict):
    tags = payload.get("tags", [])
    invalid = [t for t in tags if t not in PREDEFINED_TAGS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Неизвестные теги: {invalid}")

    repo = RecommendationRepository()
    repo.set_course_tags(course_id, tags)
    return {"success": True}


@app.get("/api/v1/courses/{course_id}/rating", tags=["Рекомендации"])
def get_my_course_rating(course_id: int, student_id: int):
    repo = RecommendationRepository()
    rating = repo.get_course_rating(student_id=student_id, course_id=course_id)
    return {"rating": rating}


@app.post("/api/v1/courses/{course_id}/rate", tags=["Рекомендации"])
def rate_course(course_id: int, payload: RateCourseModel):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(status_code=400, detail="Рейтинг должен быть от 1 до 5")

    repo = RecommendationRepository()
    repo.rate_course(
        student_id=payload.student_id,
        course_id=course_id,
        rating=payload.rating,
    )
    return {"success": True}
