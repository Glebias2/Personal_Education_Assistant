from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection

_config = EducationDatabaseConfig()


@postgre_connection(_config)
def _create_table_chats(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS chats (
            id SERIAL PRIMARY KEY,
            student_id INT NOT NULL,
            course_id INT NOT NULL,
            name TEXT NOT NULL DEFAULT 'Новый чат',
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_chats_student
                FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
            CONSTRAINT fk_chats_course
                FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_chat_messages(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            chat_id INT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_chat_messages_chat
                FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
        )
    """
    curs.execute(query)


def create_chats_tables():
    _create_table_chats()
    _create_table_chat_messages()
