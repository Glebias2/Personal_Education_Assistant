from psycopg2.extensions import cursor
from settings import EducationDatabaseConfig
from ..connection import postgre_connection


class ChatPreferencesRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def get_preferences(self, chat_id: int, curs: cursor = None) -> dict | None:
        query = """
            SELECT preferred_explanation_style, notes, updated_at
            FROM chat_preferences
            WHERE chat_id = %s
            """
        curs.execute(query, (chat_id,))
        row = curs.fetchone()
        if row:
            preferred_explanation_style, notes, updated_at = row
            return {
                "preferred_explanation_style": preferred_explanation_style,
                "notes": notes,
                "updated_at": updated_at.isoformat() if updated_at else None,
            }
        return None

    @postgre_connection(__config)
    def update_preferences(self, chat_id: int, preferred_explanation_style: str | None = None, notes: str | None = None, curs: cursor = None) -> None:
        existing = self.get_preferences(chat_id)
        if existing:
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
                UPDATE chat_preferences
                SET {', '.join(set_parts)}
                WHERE chat_id = %s
                """
            values.append(chat_id)
            curs.execute(query, values)
        else:
            query = """
                INSERT INTO chat_preferences (chat_id, preferred_explanation_style, notes)
                VALUES (%s, %s, %s)
                """
            curs.execute(query, (chat_id, preferred_explanation_style, notes))
