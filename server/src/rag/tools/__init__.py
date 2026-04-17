"""
LangChain tools для агентного AI-чата.

Функция make_agent_tools(student_id, course_id, storage_id) возвращает список
инструментов с замкнутым контекстом студента — агент не передаёт id явно,
они уже вшиты в функции через closure.
"""

from .search import make_search_tool
from .tests import make_test_tools
from .exams import make_exam_tools
from .progress import make_progress_tool
from .labs import make_labs_tool
from .preferences import make_preferences_tools


def make_agent_tools(student_id: int, course_id: int, storage_id: str, chat_id: int) -> list:
    """
    Создаёт список LangChain tools с привязанным контекстом студента.
    Используется в create_react_agent для агентного AI-чата.
    """
    search = make_search_tool(storage_id)
    test_results, test_mistakes = make_test_tools(student_id, course_id)
    exam_results, exam_details = make_exam_tools(student_id, course_id)
    progress = make_progress_tool(student_id, course_id)
    labs = make_labs_tool(course_id)
    get_prefs, update_prefs = make_preferences_tools(student_id, chat_id)

    return [
        search,
        test_results,
        test_mistakes,
        exam_results,
        exam_details,
        progress,
        labs,
        get_prefs,
        update_prefs,
    ]
