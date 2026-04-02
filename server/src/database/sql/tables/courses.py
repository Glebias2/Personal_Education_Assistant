from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection

_config = EducationDatabaseConfig()


@postgre_connection(_config)
def _create_table_courses(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            teacher_id INT NOT NULL,
            exam_questions TEXT NOT NULL,
            storage_id TEXT,
            CONSTRAINT fk_courses_teacher
                FOREIGN KEY (teacher_id)
                REFERENCES teachers (id)
                ON DELETE RESTRICT
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_students_courses(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS students_courses (
            student_id INT NOT NULL,
            course_id INT NOT NULL,
            PRIMARY KEY (student_id, course_id),
            CONSTRAINT fk_students_courses_student
                FOREIGN KEY (student_id)
                REFERENCES students (id)
                ON DELETE CASCADE,
            CONSTRAINT fk_students_courses_course
                FOREIGN KEY (course_id)
                REFERENCES courses (id)
                ON DELETE CASCADE
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_course_requests(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS course_requests (
            id SERIAL PRIMARY KEY,
            student_id INT NOT NULL,
            course_id INT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE (student_id, course_id),
            CONSTRAINT fk_course_requests_student
                FOREIGN KEY (student_id)
                REFERENCES students (id)
                ON DELETE CASCADE,
            CONSTRAINT fk_course_requests_course
                FOREIGN KEY (course_id)
                REFERENCES courses (id)
                ON DELETE CASCADE
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_course_files(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS course_files (
            id SERIAL PRIMARY KEY,
            course_id INT NOT NULL,
            filename TEXT NOT NULL,
            file_id TEXT NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_course_files_course
                FOREIGN KEY (course_id)
                REFERENCES courses (id)
                ON DELETE CASCADE
        )
    """
    curs.execute(query)


def create_courses_tables():
    _create_table_courses()
    _create_table_students_courses()
    _create_table_course_requests()
    _create_table_course_files()
