from psycopg2.extensions import cursor
from settings import EducationDatabaseConfig

from ..connection import postgre_connection
from models.report import NewReport
from models.enums import ReportStatus



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
    def get_by_student_and_course(self, student_id: int, course_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT r.id, c.title, l.title, r.url, r.status, r.comment
            FROM reports AS r
            JOIN labs AS l ON r.lab_id = l.id
            JOIN courses AS c ON l.course_id = c.id
            WHERE r.student_id = %s AND c.id = %s
            """
        curs.execute(query, (student_id, course_id))
        return curs.fetchall()

    @postgre_connection(__config)
    def get_course_report_analytics(self, course_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT r.student_id, s.first_name, s.last_name,
                   l.title AS lab_title, r.status
            FROM reports r
            JOIN labs l ON r.lab_id = l.id
            JOIN students s ON s.id = r.student_id
            WHERE l.course_id = %s
            ORDER BY r.student_id, l.number
            """
        curs.execute(query, (course_id,))
        return curs.fetchall()

    @postgre_connection(__config)
    def get_lab_funnel(self, course_id: int, curs: cursor = None) -> list[tuple]:
        """Воронка сдачи лаб: (id, number, title, enrolled, submitted, approved, rejected)."""
        query = """
            SELECT l.id, l.number, l.title,
                   COUNT(DISTINCT sc.student_id)                                          AS enrolled,
                   COUNT(DISTINCT r.student_id)                                           AS submitted,
                   COUNT(DISTINCT r.student_id) FILTER (WHERE r.status = 'approved')     AS approved,
                   COUNT(DISTINCT r.student_id) FILTER (WHERE r.status = 'not-approved') AS rejected
            FROM labs l
            JOIN courses c ON c.id = l.course_id
            JOIN students_courses sc ON sc.course_id = c.id
            LEFT JOIN reports r ON r.lab_id = l.id
            WHERE l.course_id = %(cid)s
            GROUP BY l.id, l.number, l.title
            ORDER BY l.number
        """
        curs.execute(query, {"cid": course_id})
        return curs.fetchall()

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
