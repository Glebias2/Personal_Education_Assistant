from psycopg2.extensions import cursor
from settings import EducationDatabaseConfig

from ..connection import postgre_connection
from .models import NewReport, ReportStatus



class ReportRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def add(self, report: NewReport, curs: cursor = None) -> None:
        # NEW FUNCTIONALITY: создание отчёта
        query = """
            INSERT INTO reports
            (lab_id, student_id, url)
            VALUES (%s, %s, %s)
            """
        curs.execute(query, (report.lab_id, report.student_id, report.url))

    @postgre_connection(__config)
    def get_teacher_pending_reports(self, teacher_id: int, curs: cursor = None) -> None:
        # NEW FUNCTIONALITY: получение отчётов преподавателя (pending)
        query = """
            SELECT r.id, r.student_id, c.title, l.title, r.url
            FROM reports AS r
            JOIN labs AS l ON r.lab_id = l.id
            JOIN courses AS c ON l.course_id = c.id
            WHERE c.teacher_id = %s
              AND r.status = %s
            """
        curs.execute(query, (teacher_id, ReportStatus.PENDING.value))
        labs = curs.fetchall()
        return labs

    @postgre_connection(__config)
    def set_report_status(self, report_id: int, status: ReportStatus, comment: str | None = None, curs: cursor = None) -> None:
        # NEW FUNCTIONALITY: выставление статуса отчёта и комментария
        query = """
            UPDATE reports
            SET status = %s, comment = %s
            WHERE id = %s
            """
        curs.execute(query, (status.value, comment, report_id))

    @postgre_connection(__config)
    def get_student_reports(self, student_id: int, curs: cursor = None) -> list[tuple[int, str, str, str | None, str, str | None]]:
        # NEW FUNCTIONALITY: получение отчётов студента
        query = """
            SELECT r.id, c.title, l.title, r.url, r.status, r.comment
            FROM reports AS r
            JOIN labs AS l ON r.lab_id = l.id
            JOIN courses AS c ON l.course_id = c.id
            WHERE r.student_id = %s
            """
        curs.execute(query, (student_id,))
        reports = curs.fetchall()
        return reports

    @postgre_connection(__config)
    def delete(self, report_id: int, curs: cursor = None) -> bool:
        # NEW FUNCTIONALITY: удаление отчёта
        query = """
            DELETE FROM reports
            WHERE id = %s
            RETURNING id
            """
        curs.execute(query, (report_id,))
        return bool(curs.fetchone())
