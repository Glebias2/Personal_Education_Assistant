import json

from database.sql.repositories.test_results import TestResultRepository
from database.sql.repositories.exam_results import ExamResultRepository
from database.sql.repositories.reports import ReportRepository

from ..app import app


@app.get("/api/v1/students/{student_id}/test-results", tags=["Результаты"])
def get_student_test_results(student_id: int):
    """Все результаты тестов студента."""
    repo = TestResultRepository()
    rows = repo.get_by_student(student_id)
    return {
        "results": [
            {
                "id": r[0],
                "course_id": r[1],
                "topic": r[2],
                "source": r[3],
                "difficulty": r[4],
                "total_questions": r[5],
                "correct_answers": r[6],
                "wrong_answers": r[7],
                "percentage": r[8],
                "created_at": r[9],
            }
            for r in rows
        ]
    }


@app.get("/api/v1/students/{student_id}/courses/{course_id}/test-results", tags=["Результаты"])
def get_student_course_test_results(student_id: int, course_id: int):
    """Результаты тестов студента по конкретному курсу."""
    repo = TestResultRepository()
    rows = repo.get_by_student_and_course(student_id, course_id)
    return {
        "results": [
            {
                "id": r[0],
                "topic": r[1],
                "source": r[2],
                "difficulty": r[3],
                "total_questions": r[4],
                "correct_answers": r[5],
                "wrong_answers": r[6],
                "percentage": r[7],
                "created_at": r[8],
            }
            for r in rows
        ]
    }


@app.get("/api/v1/test-results/{result_id}/answers", tags=["Результаты"])
def get_test_result_answers(result_id: int):
    """Детализация ответов конкретного теста."""
    repo = TestResultRepository()
    rows = repo.get_answers(result_id)
    return {
        "answers": [
            {
                "question_num": r[0],
                "question_text": r[1],
                "options": r[2] if isinstance(r[2], dict) else json.loads(r[2]),
                "user_answer": r[3],
                "correct_answer": r[4],
                "is_correct": r[5],
            }
            for r in rows
        ]
    }


@app.get("/api/v1/students/{student_id}/exam-results", tags=["Результаты"])
def get_student_exam_results(student_id: int):
    """Все результаты экзаменов студента."""
    repo = ExamResultRepository()
    rows = repo.get_by_student(student_id)
    return {
        "results": [
            {
                "id": r[0],
                "course_id": r[1],
                "total_questions": r[2],
                "avg_score": r[3],
                "completed": r[4],
                "created_at": r[5],
            }
            for r in rows
        ]
    }


@app.get("/api/v1/students/{student_id}/courses/{course_id}/exam-results", tags=["Результаты"])
def get_student_course_exam_results(student_id: int, course_id: int):
    """Результаты экзаменов студента по конкретному курсу."""
    repo = ExamResultRepository()
    rows = repo.get_by_student_and_course(student_id, course_id)
    return {
        "results": [
            {
                "id": r[0],
                "total_questions": r[1],
                "avg_score": r[2],
                "completed": r[3],
                "created_at": r[4],
            }
            for r in rows
        ]
    }


@app.get("/api/v1/students/{student_id}/courses/{course_id}/reports", tags=["Результаты"])
def get_student_course_reports(student_id: int, course_id: int):
    """Отчёты студента по лабам конкретного курса."""
    rows = ReportRepository().get_by_student_and_course(student_id, course_id)
    return {
        "reports": [
            {
                "id": r[0],
                "lab_title": r[2],
                "url": r[3],
                "status": r[4],
                "comment": r[5],
            }
            for r in (rows or [])
        ]
    }


@app.get("/api/v1/courses/{course_id}/analytics", tags=["Аналитика"])
def get_course_analytics(course_id: int):
    """Агрегированная аналитика курса для дашборда преподавателя."""
    test_repo = TestResultRepository()
    exam_repo = ExamResultRepository()
    report_repo = ReportRepository()

    test_stats = test_repo.get_course_analytics(course_id)
    exam_stats = exam_repo.get_course_analytics(course_id)
    report_rows = report_repo.get_course_report_analytics(course_id)
    timeline = test_repo.get_course_timeline(course_id)
    topic_accuracy = test_repo.get_topic_accuracy(course_id)
    hard_questions = test_repo.get_hard_questions(course_id)
    difficulty_breakdown = test_repo.get_difficulty_breakdown(course_id)
    verdict_dist = exam_repo.get_verdict_distribution(course_id)
    lab_funnel = report_repo.get_lab_funnel(course_id)

    return {
        "test_averages": [
            {
                "student_id": r[0],
                "first_name": r[1],
                "last_name": r[2],
                "test_count": r[3],
                "avg_percentage": float(r[4]) if r[4] is not None else None,
            }
            for r in (test_stats or [])
        ],
        "exam_averages": [
            {
                "student_id": r[0],
                "first_name": r[1],
                "last_name": r[2],
                "exam_count": r[3],
                "avg_score": float(r[4]) if r[4] is not None else None,
            }
            for r in (exam_stats or [])
        ],
        "report_statuses": [
            {
                "student_id": r[0],
                "first_name": r[1],
                "last_name": r[2],
                "lab_title": r[3],
                "status": r[4],
            }
            for r in (report_rows or [])
        ],
        "test_timeline": [
            {
                "student_id": r[0],
                "first_name": r[1],
                "last_name": r[2],
                "percentage": float(r[3]) if r[3] is not None else None,
                "topic": r[4],
                "created_at": r[5],
            }
            for r in (timeline or [])
        ],
        "topic_accuracy": [
            {
                "topic": r[0],
                "total_q": r[1],
                "correct_q": r[2],
                "accuracy_pct": float(r[3]) if r[3] is not None else 0.0,
                "test_count": r[4],
            }
            for r in (topic_accuracy or [])
        ],
        "hard_questions": [
            {
                "question_text": r[0],
                "attempts": r[1],
                "correct": r[2],
                "success_rate": float(r[3]) if r[3] is not None else 0.0,
                "topic": r[4],
            }
            for r in (hard_questions or [])
        ],
        "difficulty_breakdown": [
            {
                "difficulty": r[0],
                "test_count": r[1],
                "avg_pct": float(r[2]) if r[2] is not None else 0.0,
            }
            for r in (difficulty_breakdown or [])
        ],
        "verdict_distribution": [
            {"verdict": r[0], "count": r[1]}
            for r in (verdict_dist or [])
        ],
        "lab_funnel": [
            {
                "id": r[0],
                "number": r[1],
                "title": r[2],
                "enrolled": r[3],
                "submitted": r[4],
                "approved": r[5],
                "rejected": r[6],
            }
            for r in (lab_funnel or [])
        ],
    }


@app.get("/api/v1/exam-results/{result_id}/answers", tags=["Результаты"])
def get_exam_result_answers(result_id: int):
    """Детализация ответов конкретного экзамена."""
    repo = ExamResultRepository()
    rows = repo.get_answers(result_id)
    return {
        "answers": [
            {
                "question_id": r[0],
                "question_text": r[1],
                "user_answer": r[2],
                "verdict": r[3],
                "recommendation": r[4],
                "issues": json.loads(r[5]) if isinstance(r[5], str) else r[5],
                "score": r[6],
            }
            for r in rows
        ]
    }
