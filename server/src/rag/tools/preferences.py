"""
Инструменты для работы с предпочтениями студента.

Двухуровневая логика:
- get: сначала чат-предпочтения, фоллбэк на глобальные
- update: пишет только в чат-предпочтения
"""

from langchain_core.tools import tool
from database.sql.repositories.student_preferences import StudentPreferencesRepository
from database.sql.repositories.chat_preferences import ChatPreferencesRepository


def make_preferences_tools(student_id: int, chat_id: int):
    """
    Создаёт инструменты для работы с предпочтениями студента.
    Возвращает кортеж: (get_preferences_tool, update_preferences_tool)
    """

    @tool
    def get_student_preferences() -> str:
        """
        Получить предпочтения студента по объяснениям и заметки.
        Возвращает информацию о том, как студент предпочитает получать объяснения.
        """
        # Сначала ищем предпочтения конкретного чата
        chat_repo = ChatPreferencesRepository()
        prefs = chat_repo.get_preferences(chat_id)
        source = "чат"

        # Если нет — фоллбэк на глобальные предпочтения студента
        if not prefs:
            student_repo = StudentPreferencesRepository()
            prefs = student_repo.get_preferences(student_id)
            source = "профиль"

        if prefs:
            style = prefs.get("preferred_explanation_style", "не указано")
            notes = prefs.get("notes", "нет заметок")
            return f"Предпочтения студента (источник: {source}): стиль объяснения - {style}, заметки - {notes}"
        else:
            return "Предпочтения студента не установлены."

    @tool
    def update_student_preferences(preferred_explanation_style: str, notes: str = "") -> str:
        """
        Обновить предпочтения студента по объяснениям в текущем чате.
        preferred_explanation_style: описание того, как студент хочет получать объяснения (например, 'подробно с примерами', 'кратко', 'с визуалами' и т.д.)
        notes: дополнительные заметки о предпочтениях студента.
        """
        chat_repo = ChatPreferencesRepository()
        chat_repo.update_preferences(chat_id, preferred_explanation_style, notes)
        return f"Предпочтения для этого чата обновлены: стиль - {preferred_explanation_style}, заметки - {notes}"

    return get_student_preferences, update_student_preferences
