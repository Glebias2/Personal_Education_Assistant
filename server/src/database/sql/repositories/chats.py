from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection


class ChatRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def create_chat(self, student_id: int, course_id: int, name: str, curs: cursor = None) -> int:
        query = """
            INSERT INTO chats (student_id, course_id, name)
            VALUES (%s, %s, %s)
            RETURNING id
        """
        curs.execute(query, (student_id, course_id, name))
        return int(curs.fetchone()[0])

    @postgre_connection(__config)
    def get_chat(self, chat_id: int, curs: cursor = None) -> tuple | None:
        query = """
            SELECT id, student_id, course_id, name, created_at::text
            FROM chats
            WHERE id = %s
        """
        curs.execute(query, (chat_id,))
        return curs.fetchone()

    @postgre_connection(__config)
    def get_student_chats(self, student_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT ch.id, ch.name, ch.course_id, c.title, ch.created_at::text
            FROM chats ch
            JOIN courses c ON c.id = ch.course_id
            WHERE ch.student_id = %s
            ORDER BY ch.created_at DESC
        """
        curs.execute(query, (student_id,))
        return curs.fetchall()

    @postgre_connection(__config)
    def add_message(self, chat_id: int, role: str, content: str, curs: cursor = None) -> None:
        query = """
            INSERT INTO chat_messages (chat_id, role, content)
            VALUES (%s, %s, %s)
        """
        curs.execute(query, (chat_id, role, content))

    @postgre_connection(__config)
    def delete_chat(self, chat_id: int, curs: cursor = None) -> bool:
        query = "DELETE FROM chats WHERE id = %s RETURNING id"
        curs.execute(query, (chat_id,))
        return bool(curs.fetchone())

    @postgre_connection(__config)
    def rename_chat(self, chat_id: int, name: str, curs: cursor = None) -> bool:
        query = "UPDATE chats SET name = %s WHERE id = %s RETURNING id"
        curs.execute(query, (name, chat_id))
        return bool(curs.fetchone())

    @postgre_connection(__config)
    def get_messages(self, chat_id: int, limit: int = 20, curs: cursor = None) -> list[tuple[str, str]]:
        """Returns last `limit` messages as list of (role, content) tuples."""
        query = """
            SELECT role, content FROM (
                SELECT role, content, created_at
                FROM chat_messages
                WHERE chat_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            ) sub
            ORDER BY created_at ASC
        """
        curs.execute(query, (chat_id, limit))
        return curs.fetchall()
