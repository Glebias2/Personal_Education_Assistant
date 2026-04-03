"""
Чистые функции доступа к данным для RAG-агента и MCP-сервера.

Содержит только логику получения и форматирования данных из репозиториев.
Не зависит ни от LangChain, ни от FastMCP — импортируется обеими системами.
"""
import json

from database.sql.repositories.test_results import TestResultRepository
from database.sql.repositories.exam_results import ExamResultRepository
from database.sql.repositories.reports import ReportRepository
from database.sql.repositories.labs import LabRepository
from database.vector.repositories.storage import StorageManager


def query_test_results(student_id: int, course_id: int) -> list[dict]:
    """Результаты тестов студента по курсу."""
    rows = TestResultRepository().get_by_student_and_course(student_id, course_id)
    return [
        {
            "id": row[0],
            "topic": row[1],
            "source": row[2],
            "difficulty": row[3],
            "total_questions": row[4],
            "correct_answers": row[5],
            "wrong_answers": row[6],
            "percentage": float(row[7]) if row[7] is not None else None,
            "created_at": str(row[8]),
        }
        for row in (rows or [])
    ]


def query_test_mistakes(test_result_id: int) -> list[dict]:
    """Только ошибочные ответы конкретного теста."""
    rows = TestResultRepository().get_answers(test_result_id)
    mistakes = []
    for row in (rows or []):
        q_num, q_text, options, user_ans, correct_ans, is_correct = row
        if is_correct:
            continue
        if isinstance(options, str):
            options = json.loads(options)
        mistakes.append({
            "question_num": q_num,
            "question_text": q_text,
            "options": options,
            "user_answer": user_ans,
            "correct_answer": correct_ans,
        })
    return mistakes


def query_exam_results(student_id: int, course_id: int) -> list[dict]:
    """Результаты экзаменов студента по курсу."""
    rows = ExamResultRepository().get_by_student_and_course(student_id, course_id)
    return [
        {
            "id": row[0],
            "total_questions": row[1],
            "avg_score": float(row[2]) if row[2] is not None else None,
            "completed": row[3],
            "created_at": str(row[4]),
        }
        for row in (rows or [])
    ]


def query_exam_details(exam_result_id: int) -> list[dict]:
    """Детали конкретного экзамена: вопросы, ответы, вердикты."""
    rows = ExamResultRepository().get_answers(exam_result_id)
    return [
        {
            "question_id": row[0],
            "question_text": row[1],
            "user_answer": row[2],
            "verdict": row[3],
            "recommendation": row[4],
            "issues": row[5],
            "score": row[6],
        }
        for row in (rows or [])
    ]


def query_progress(student_id: int, course_id: int) -> dict:
    """Сводка прогресса студента: тесты, экзамены, отчёты."""
    test_rows = TestResultRepository().get_by_student_and_course(student_id, course_id)
    test_pcts = [float(r[7]) for r in (test_rows or []) if r[7] is not None]

    exam_rows = ExamResultRepository().get_by_student_and_course(student_id, course_id)
    exam_scores = [float(r[2]) for r in (exam_rows or []) if r[2] is not None]

    report_rows = ReportRepository().get_by_student_and_course(student_id, course_id)
    statuses: dict[str, int] = {"approved": 0, "pending": 0, "not-approved": 0}
    report_details = []
    for r in (report_rows or []):
        if r[4] in statuses:
            statuses[r[4]] += 1
        report_details.append({"lab_title": r[2], "status": r[4], "comment": r[5]})

    return {
        "tests": {
            "count": len(test_pcts),
            "avg_percentage": sum(test_pcts) / len(test_pcts) if test_pcts else None,
        },
        "exams": {
            "count": len(exam_rows) if exam_rows else 0,
            "avg_score": sum(exam_scores) / len(exam_scores) if exam_scores else None,
        },
        "reports": {
            "total": sum(statuses.values()),
            **statuses,
            "details": report_details,
        },
    }


def query_course_labs(course_id: int) -> list[dict]:
    """Список лабораторных работ курса."""
    rows = LabRepository().get_labs(course_id)
    return [
        {
            "id": row[0],
            "number": row[1],
            "title": row[2],
            "task": row[3],
        }
        for row in (rows or [])
    ]


def query_search_materials(storage_id: str, query: str, k: int = 8, alpha: float = 0.75) -> list[str]:
    """Гибридный поиск по материалам курса. Возвращает список текстовых чанков."""
    vector_storage = StorageManager.get_vector_storage(storage_id)
    docs = vector_storage.hybrid_search(query, k=k, alpha=alpha)
    return [doc.page_content for doc in (docs or [])]
