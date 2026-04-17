from psycopg2.extensions import cursor
from settings import EducationDatabaseConfig
from ..connection import postgre_connection


class StudentPreferencesRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def get_preferences(self, student_id: int, curs: cursor = None) -> dict | None:
        query = """
            SELECT preferred_explanation_style, notes, updated_at
            FROM student_preferences
            WHERE student_id = %s
            """
        curs.execute(query, (student_id,))
        row = curs.fetchone()
        if row:
            preferred_explanation_style, notes, updated_at = row
            return {
                "preferred_explanation_style": preferred_explanation_style,
                "notes": notes,
                "updated_at": updated_at.isoformat() if updated_at else None
            }
        return None

    @postgre_connection(__config)
    def update_preferences(self, student_id: int, preferred_explanation_style: str | None = None, notes: str | None = None, curs: cursor = None) -> None:
        # Сначала проверим, существует ли запись
        existing = self.get_preferences(student_id)
        if existing:
            # Обновляем
            set_parts = []
            values = []
            if preferred_explanation_style is not None:
                set_parts.append("preferred_explanation_style = %s")
                values.append(preferred_explanation_style)
            if notes is not None:
                set_parts.append("notes = %s")
                values.append(notes)
            set_parts.append("updated_at = CURRENT_TIMESTAMP")
            query = f"""
                UPDATE student_preferences
                SET {', '.join(set_parts)}
                WHERE student_id = %s
                """
            values.append(student_id)
            curs.execute(query, values)
        else:
            # Вставляем новую
            query = """
                INSERT INTO student_preferences (student_id, preferred_explanation_style, notes)
                VALUES (%s, %s, %s)
                """
            curs.execute(query, (student_id, preferred_explanation_style, notes))
