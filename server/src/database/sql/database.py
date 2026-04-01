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
        self.__create_table_test_results()
        self.__create_table_test_result_answers()
        self.__create_table_exam_results()
        self.__create_table_exam_result_answers()

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

    @postgre_connection(__config)
    def __create_table_test_results(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_test_result_answers(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_exam_results(self, curs: cursor = None) -> None:
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

    @postgre_connection(__config)
    def __create_table_exam_result_answers(self, curs: cursor = None) -> None:
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
