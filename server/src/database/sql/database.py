from psycopg2.extensions import cursor
from settings import EducationDatabaseConfig

from .repositories import ReportStatus
from .connection import postgre_connection

class Database:
    __config = EducationDatabaseConfig()

    def create_tables(self):
        self.__create_table_teachers()
        self.__create_table_students()
        self.__create_table_courses()
        self.__create_table_labs()
        self.__create_report_status_enum()
        self.__create_table_reports()
        self.__create_table_students_courses()
        self.__create_table_course_requests()
        self.__create_table_course_files()
        self.__create_table_chats()
        self.__create_table_chat_messages()

    @postgre_connection(__config)
    def __create_table_teachers(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_students(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_courses(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_labs(self, curs: cursor = None) -> None:
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


    @postgre_connection(__config)
    def __create_report_status_enum(self, *, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_reports(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_students_courses(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_course_files(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_chats(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_chat_messages(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_course_requests(self, curs: cursor = None) -> None:
        # NEW FUNCTIONALITY: таблица заявок на зачисление в курс
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
