from psycopg2.extensions import cursor
from settings import EducationDatabaseConfig
from ..connection import postgre_connection


class StudentRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def auth(self, login: str, password: str, curs: cursor = None) -> int | None:
        # NEW FUNCTIONALITY: корректная авторизация студента (возвращаем id)
        query = """
            SELECT id
            FROM students
            WHERE login = %s
            AND password = %s
            """
        curs.execute(query, (login, password))
        row = curs.fetchone()
        student_id = row[0] if row else None
        return student_id

    @postgre_connection(__config)
    def is_login_already_used(self, login: str, curs: cursor = None) -> bool:
        query = """
            SELECT 1
            FROM students
            WHERE login = %s
            """
        curs.execute(query, (login,))
        check = curs.fetchone()
        return bool(check)

    @postgre_connection(__config)
    def create(
        self,
        *,
        login: str,
        password: str,
        first_name: str,
        last_name: str,
        characteristic: str | None = None,
        curs: cursor = None,
    ) -> int:
        # NEW FUNCTIONALITY: регистрация (создание) студента
        query = """
            INSERT INTO students (login, password, first_name, last_name, characteristic, storage_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """
        vector_storage_id = 1  # TODO: Get real storage id
        curs.execute(query, (login, password, first_name, last_name, characteristic, vector_storage_id))
        return int(curs.fetchone()[0])

    @postgre_connection(__config)
    def delete(self, student_id: int, curs: cursor = None) -> bool:
        # NEW FUNCTIONALITY: удаление студента
        query = """
            DELETE FROM students
            WHERE id = %s
            RETURNING id
            """
        curs.execute(query, (student_id,))
        return bool(curs.fetchone())

    @postgre_connection(__config)
    def get_by_id(self, student_id: int, curs: cursor = None) -> tuple[int, str, str, str, str | None] | None:
        # NEW FUNCTIONALITY: получение данных студента
        query = """
            SELECT id, login, first_name, last_name, characteristic
            FROM students
            WHERE id = %s
            """
        curs.execute(query, (student_id,))
        row = curs.fetchone()
        return row if row else None

    @postgre_connection(__config)
    def get_storage_id(self, student_id: int, curs: cursor = None) -> int:
        query = """
            SELECT storage_id
            FROM students
            WHERE id = %s
            """
        curs.execute(query, (student_id,))
        row = curs.fetchone()
        return int(row[0]) if row and row[0] is not None else 0

    @postgre_connection(__config)
    def get_first_and_last_names(self, student_id: int, curs: cursor = None) -> tuple[str, str]:
        query = """
            SELECT first_name, last_name
            FROM students
            WHERE id = %s
            """
        curs.execute(query, (student_id,))
        first_name, last_name = curs.fetchone()
        return first_name, last_name

    @postgre_connection(__config)
    def update_characteristic(self, student_id: int, characteristic: str, curs: cursor = None) -> str | None:
        query = """
            UPDATE students
            SET characteristic = %s
            WHERE id = %s
            """
        curs.execute(query, (characteristic, student_id))

    @postgre_connection(__config)
    def get_characteristic(self, student_id: int, curs: cursor = None) -> str | None:
        query = """
            SELECT characteristic
            FROM students
            WHERE id = %s
            """
        curs.execute(query, (student_id,))
        row = curs.fetchone()
        return row[0] if row else None
