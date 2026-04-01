"""
MCP сервер для образовательной платформы.

Запуск:
    cd server/src
    fastmcp run mcp_servers/education_tools.py --transport sse --port 8001

Предоставляет инструменты для внешних MCP-клиентов (Claude Desktop и др.):
- get_student_test_results   — список попыток тестов студента по курсу
- get_test_mistakes          — ошибки студента в конкретном тесте
- get_student_exam_results   — список попыток экзаменов студента по курсу
- get_exam_details           — детали конкретного экзамена
- search_course_materials    — гибридный поиск по материалам курса
"""
import sys
import os

# Добавляем server/src в путь, чтобы работали импорты из database, settings и т.д.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastmcp import FastMCP

from database.sql.repositories.test_results import TestResultRepository
from database.sql.repositories.exam_results import ExamResultRepository
from database.sql.repositories.reports import ReportRepository
from database.vector.repositories.storage import StorageManager


mcp = FastMCP("Образовательный ассистент")


@mcp.tool()
def get_student_test_results(student_id: int, course_id: int) -> list[dict]:
    """
    Список попыток тестов студента по курсу.
    Возвращает: id, тему, источник, сложность, % правильных ответов, дату.
    """
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
            "created_at": row[8],
        }
        for row in rows
    ]


@mcp.tool()
def get_test_mistakes(test_result_id: int) -> list[dict]:
    """
    Ошибки студента в конкретном тесте.
    Возвращает только неправильные ответы: вопрос, ответ студента, правильный ответ.
    """
    rows = TestResultRepository().get_answers(test_result_id)
    return [
        {
            "question_num": row[0],
            "question_text": row[1],
            "options": row[2],
            "user_answer": row[3],
            "correct_answer": row[4],
        }
        for row in rows
        if not row[5]  # is_correct == False
    ]


@mcp.tool()
def get_student_exam_results(student_id: int, course_id: int) -> list[dict]:
    """
    Список попыток экзаменов студента по курсу.
    Возвращает: id, кол-во вопросов, средний балл, завершён ли, дату.
    """
    rows = ExamResultRepository().get_by_student_and_course(student_id, course_id)
    return [
        {
            "id": row[0],
            "total_questions": row[1],
            "avg_score": float(row[2]) if row[2] is not None else None,
            "completed": row[3],
            "created_at": row[4],
        }
        for row in rows
    ]


@mcp.tool()
def get_exam_details(exam_result_id: int) -> list[dict]:
    """
    Детали конкретного экзамена: вопросы, ответы студента, вердикты, рекомендации.
    """
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
        for row in rows
    ]


@mcp.tool()
def search_course_materials(storage_id: str, query: str, k: int = 5) -> str:
    """
    Гибридный поиск по материалам курса (BM25 + vector).
    Используй для объяснения тем и поиска правильных ответов.
    storage_id — идентификатор хранилища курса.
    """
    try:
        vector_storage = StorageManager.get_vector_storage(storage_id)
        docs = vector_storage.hybrid_search(query, k=k, alpha=0.75)
        if not docs:
            return "По запросу ничего не найдено в материалах курса."
        return "\n\n---\n\n".join(doc.page_content for doc in docs)
    except Exception as e:
        return f"Ошибка поиска: {e}"


@mcp.tool()
def get_student_progress(student_id: int, course_id: int) -> dict:
    """
    Сводка прогресса студента по курсу: тесты, экзамены, лабораторные.
    """
    test_rows = TestResultRepository().get_by_student_and_course(student_id, course_id)
    test_pcts = [float(r[7]) for r in test_rows] if test_rows else []

    exam_rows = ExamResultRepository().get_by_student_and_course(student_id, course_id)
    exam_scores = [float(r[2]) for r in exam_rows if r[2] is not None] if exam_rows else []

    report_rows = ReportRepository().get_by_student_and_course(student_id, course_id)
    statuses = {"approved": 0, "pending": 0, "not-approved": 0}
    for r in (report_rows or []):
        if r[4] in statuses:
            statuses[r[4]] += 1

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
        },
    }


if __name__ == "__main__":
    mcp.run()
