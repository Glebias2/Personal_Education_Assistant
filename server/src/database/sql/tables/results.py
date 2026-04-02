from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection

_config = EducationDatabaseConfig()


@postgre_connection(_config)
def _create_table_test_results(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS test_results (
            id SERIAL PRIMARY KEY,
            student_id INT NOT NULL,
            course_id INT NOT NULL,
            topic TEXT,
            source TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            total_questions INT NOT NULL,
            correct_answers INT NOT NULL,
            wrong_answers INT NOT NULL,
            percentage REAL NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_test_results_student
                FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
            CONSTRAINT fk_test_results_course
                FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_test_result_answers(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS test_result_answers (
            id SERIAL PRIMARY KEY,
            test_result_id INT NOT NULL,
            question_num INT NOT NULL,
            question_text TEXT NOT NULL,
            options JSONB NOT NULL,
            user_answer TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            is_correct BOOLEAN NOT NULL,
            CONSTRAINT fk_test_result_answers_result
                FOREIGN KEY (test_result_id) REFERENCES test_results (id) ON DELETE CASCADE
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_exam_results(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS exam_results (
            id SERIAL PRIMARY KEY,
            student_id INT NOT NULL,
            course_id INT NOT NULL,
            total_questions INT NOT NULL,
            avg_score REAL,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_exam_results_student
                FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
            CONSTRAINT fk_exam_results_course
                FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_exam_result_answers(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS exam_result_answers (
            id SERIAL PRIMARY KEY,
            exam_result_id INT NOT NULL,
            question_id INT NOT NULL,
            question_text TEXT NOT NULL,
            user_answer TEXT NOT NULL,
            verdict TEXT NOT NULL,
            recommendation TEXT,
            issues TEXT,
            score TEXT,
            CONSTRAINT fk_exam_result_answers_result
                FOREIGN KEY (exam_result_id) REFERENCES exam_results (id) ON DELETE CASCADE
        )
    """
    curs.execute(query)


def create_results_tables():
    _create_table_test_results()
    _create_table_test_result_answers()
    _create_table_exam_results()
    _create_table_exam_result_answers()
