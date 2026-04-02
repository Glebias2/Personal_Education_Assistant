from psycopg2.extensions import cursor

from models.enums import ReportStatus
from settings import EducationDatabaseConfig
from ..connection import postgre_connection

_config = EducationDatabaseConfig()


@postgre_connection(_config)
def _create_report_status_enum(*, curs: cursor = None) -> None:
    query = """
        DO $$
        BEGIN
            CREATE TYPE report_status AS ENUM (%s, %s, %s);
        EXCEPTION
            WHEN duplicate_object THEN
                NULL;
        END $$;
        """
    curs.execute(query, (
        ReportStatus.PENDING.value,
        ReportStatus.APPROVED.value,
        ReportStatus.NOT_APPROVED.value
    ))


@postgre_connection(_config)
def _create_table_reports(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            lab_id INT NOT NULL,
            student_id INT NOT NULL,
            status report_status DEFAULT 'pending',
            url TEXT,
            comment TEXT,
            CONSTRAINT fk_reports_lab
                FOREIGN KEY (lab_id)
                REFERENCES labs (id)
                ON DELETE CASCADE,
            CONSTRAINT fk_reports_student
                FOREIGN KEY (student_id)
                REFERENCES students (id)
                ON DELETE CASCADE
        )
    """
    curs.execute(query)


def create_reports_tables():
    _create_report_status_enum()
    _create_table_reports()
