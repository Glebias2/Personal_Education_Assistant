"""
MCP сервер для образовательной платформы.

Запуск:
    cd server/src
    fastmcp run mcp_servers/education_tools.py --transport sse --port 8001

Предоставляет инструменты для внешних MCP-клиентов (Claude Desktop и др.).
Логика доступа к данным импортируется из rag.queries.
"""
import sys
import os

# Добавляем server/src в путь, чтобы работали импорты из database, settings и т.д.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastmcp import FastMCP

from rag.queries import (
    query_test_results,
    query_test_mistakes,
    query_exam_results,
    query_exam_details,
    query_progress,
    query_search_materials,
)

mcp = FastMCP("Образовательный ассистент")


@mcp.tool()
def get_student_test_results(student_id: int, course_id: int) -> list[dict]:
    """
    Список попыток тестов студента по курсу.
    Возвращает: id, тему, источник, сложность, % правильных ответов, дату.
    """
    return query_test_results(student_id, course_id)


@mcp.tool()
def get_test_mistakes(test_result_id: int) -> list[dict]:
    """
    Ошибки студента в конкретном тесте.
    Возвращает только неправильные ответы: вопрос, ответ студента, правильный ответ.
    """
    return query_test_mistakes(test_result_id)


@mcp.tool()
def get_student_exam_results(student_id: int, course_id: int) -> list[dict]:
    """
    Список попыток экзаменов студента по курсу.
    Возвращает: id, кол-во вопросов, средний балл, завершён ли, дату.
    """
    return query_exam_results(student_id, course_id)


@mcp.tool()
def get_exam_details(exam_result_id: int) -> list[dict]:
    """
    Детали конкретного экзамена: вопросы, ответы студента, вердикты, рекомендации.
    """
    return query_exam_details(exam_result_id)


@mcp.tool()
def search_course_materials(storage_id: str, query: str, k: int = 5) -> str:
    """
    Гибридный поиск по материалам курса (BM25 + vector).
    Используй для объяснения тем и поиска правильных ответов.
    storage_id — идентификатор хранилища курса.
    """
    chunks = query_search_materials(storage_id, query, k=k)
    if not chunks:
        return "По запросу ничего не найдено в материалах курса."
    return "\n\n---\n\n".join(chunks)


@mcp.tool()
def get_student_progress(student_id: int, course_id: int) -> dict:
    """
    Сводка прогресса студента по курсу: тесты, экзамены, лабораторные.
    """
    return query_progress(student_id, course_id)


if __name__ == "__main__":
    mcp.run()
