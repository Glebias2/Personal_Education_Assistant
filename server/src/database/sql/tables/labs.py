from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection

_config = EducationDatabaseConfig()


@postgre_connection(_config)
def create_labs_table(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS labs (
            id SERIAL PRIMARY KEY,
            number INT NOT NULL,
            title TEXT NOT NULL,
            task TEXT,
            course_id INT NOT NULL,
            CONSTRAINT fk_labs_course
                FOREIGN KEY (course_id)
                REFERENCES courses (id)
                ON DELETE CASCADE
        )
    """
    curs.execute(query)
