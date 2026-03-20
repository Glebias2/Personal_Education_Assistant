from psycopg2.extensions import cursor

from .models import NewCourse

from settings import EducationDatabaseConfig
from ..connection import postgre_connection
from database.vector.repositories import StorageManager


class CourseRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def get_student_courses(self, student_id: int, curs: cursor = None) -> list[tuple[int, str]]:
        query = """
            SELECT sc.course_id, c.title
            FROM students_courses AS sc
            JOIN courses AS c ON sc.course_id = c.id
            WHERE student_id = %s
            """
        curs.execute(query, (student_id,))
        courses = curs.fetchall()
        return courses

    @postgre_connection(__config)
    def get_teacher_courses(self, teacher_id: int, curs: cursor = None) -> list[tuple[int, str]]:
        query = """
            SELECT id, title
            FROM courses
            WHERE teacher_id = %s
            """
        curs.execute(query, (teacher_id,))
        courses = curs.fetchall()
        return courses

    @postgre_connection(__config)
    def create(self, course: NewCourse, curs: cursor = None) -> None:
        vector_storage_id = StorageManager.create_storage()

        query = """
            INSERT INTO courses
            (title, teacher_id, exam_questions, storage_id)
            VALUES (%s, %s, %s, %s)
            """
        curs.execute(query, (course.title, course.teacher_id, course.exam_questions, vector_storage_id))

    @postgre_connection(__config)
    def get_storage_id(self, course_id: int, curs: cursor = None) -> str | None:
        query = """
            SELECT storage_id
            FROM courses
            WHERE id = %s
            """
        curs.execute(query, (course_id,))
        storage_id = curs.fetchone()
        return storage_id[0] if storage_id else None

    @postgre_connection(__config)
    def get_exam_questions(self, course_id: int, curs: cursor = None) -> str | None:
        query = """
            SELECT exam_questions
            FROM courses
            WHERE id = %s
            """
        curs.execute(query, (course_id,))
        exam_questions = curs.fetchone()
        return exam_questions[0] if exam_questions else None
    
    @postgre_connection(__config)
    def get_course_info(self, course_id: int, curs: cursor = None) -> str | None:
        query = """
            SELECT id, title, teacher_id, exam_questions, storage_id
            FROM courses
            WHERE id = %s
            """
        curs.execute(query, (course_id,))
        curses_info = curs.fetchall()
        return curses_info
    
    @postgre_connection(__config)
    def get_students(self, course_id: int, curs: cursor = None) -> str | None:
        query = """
            SELECT s.id, s.first_name, s.last_name
            FROM students s
            JOIN students_courses sc ON s.id = sc.student_id
            WHERE sc.course_id = %s
            """
        curs.execute(query, (course_id,))
        curses_info = curs.fetchall()
        return curses_info

    @postgre_connection(__config)
    def list_all(self, curs: cursor = None) -> list[tuple[int, str, int]]:
        # NEW FUNCTIONALITY: список всех курсов (для витрины студенту)
        query = """
            SELECT id, title, teacher_id
            FROM courses
            ORDER BY id DESC
            """
        curs.execute(query)
        return curs.fetchall()

    @postgre_connection(__config)
    def create_course_request(self, *, student_id: int, course_id: int, curs: cursor = None) -> int:
        # NEW FUNCTIONALITY: студент отправляет заявку на курс
        query = """
            INSERT INTO course_requests (student_id, course_id, status)
            VALUES (%s, %s, 'pending')
            ON CONFLICT (student_id, course_id)
            DO UPDATE SET status = 'pending'
            RETURNING id
            """
        curs.execute(query, (student_id, course_id))
        return int(curs.fetchone()[0])

    @postgre_connection(__config)
    def get_course_requests(self, course_id: int, curs: cursor = None) -> list[tuple[int, int, int, str, str, str, str]]:
        # NEW FUNCTIONALITY: заявки на курс (для преподавателя)
        query = """
            SELECT cr.id, cr.student_id, cr.course_id, cr.status, cr.created_at::text,
                   s.first_name, s.last_name
            FROM course_requests cr
            JOIN students s ON s.id = cr.student_id
            WHERE cr.course_id = %s
            ORDER BY cr.created_at DESC
            """
        curs.execute(query, (course_id,))
        return curs.fetchall()

    @postgre_connection(__config)
    def set_course_request_status(self, request_id: int, status: str, curs: cursor = None) -> bool:
        # NEW FUNCTIONALITY: изменить статус заявки (approve/reject)
        query = """
            UPDATE course_requests
            SET status = %s
            WHERE id = %s
            RETURNING id
            """
        curs.execute(query, (status, request_id))
        return bool(curs.fetchone())

    @postgre_connection(__config)
    def enroll_student(self, *, student_id: int, course_id: int, curs: cursor = None) -> None:
        # NEW FUNCTIONALITY: зачислить студента на курс (идемпотентно)
        query = """
            INSERT INTO students_courses (student_id, course_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """
        curs.execute(query, (student_id, course_id))

    @postgre_connection(__config)
    def get_course_request_by_id(self, request_id: int, curs: cursor = None) -> tuple[int, int, str] | None:
        # NEW FUNCTIONALITY: получить заявку по id (student_id, course_id, status)
        query = """
            SELECT student_id, course_id, status
            FROM course_requests
            WHERE id = %s
            """
        curs.execute(query, (request_id,))
        row = curs.fetchone()
        return row if row else None

    @postgre_connection(__config)
    def delete(self, course_id: int, curs: cursor = None) -> bool:
        # NEW FUNCTIONALITY: удаление курса
        query = """
            DELETE FROM courses
            WHERE id = %s
            RETURNING id
            """
        curs.execute(query, (course_id,))
        return bool(curs.fetchone())

    @postgre_connection(__config)
    def update(
        self,
        course_id: int,
        *,
        title: str | None = None,
        exam_questions: str | None = None,
        storage_id: str | None = None,
        curs: cursor = None,
    ) -> bool:
        # NEW FUNCTIONALITY: обновление курса (для совместимости с текущим фронтом)
        query = """
            UPDATE courses
            SET
                title = COALESCE(%s, title),
                exam_questions = COALESCE(%s, exam_questions),
                storage_id = COALESCE(%s, storage_id)
            WHERE id = %s
            RETURNING id
            """
        curs.execute(query, (title, exam_questions, storage_id, course_id))
        return bool(curs.fetchone())

    @postgre_connection(__config)
    def add_course_file(self, course_id: int, filename: str, file_id: str, curs: cursor = None) -> int:
        query = """
            INSERT INTO course_files (course_id, filename, file_id)
            VALUES (%s, %s, %s)
            RETURNING id
            """
        curs.execute(query, (course_id, filename, file_id))
        return curs.fetchone()[0]

    @postgre_connection(__config)
    def get_course_files(self, course_id: int, curs: cursor = None) -> list:
        query = """
            SELECT id, filename, file_id, created_at
            FROM course_files
            WHERE course_id = %s
            ORDER BY created_at DESC
            """
        curs.execute(query, (course_id,))
        return curs.fetchall()

    @postgre_connection(__config)
    def delete_course_file(self, file_record_id: int, curs: cursor = None) -> bool:
        query = """
            DELETE FROM course_files WHERE id = %s RETURNING id
            """
        curs.execute(query, (file_record_id,))
        return bool(curs.fetchone())
