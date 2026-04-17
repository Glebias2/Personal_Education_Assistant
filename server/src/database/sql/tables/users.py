from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection

_config = EducationDatabaseConfig()


@postgre_connection(_config)
def _create_table_teachers(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS teachers (
            id SERIAL PRIMARY KEY,
            login TEXT NOT NULL,
            password TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_students(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            login TEXT NOT NULL,
            password TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            characteristic TEXT,
            storage_id INT
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_student_preferences(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS student_preferences (
            student_id INT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
            preferred_explanation_style TEXT,
            notes TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    curs.execute(query)


def create_users_tables():
    _create_table_teachers()
    _create_table_students()
    _create_table_student_preferences()
