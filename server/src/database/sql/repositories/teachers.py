from psycopg2.extensions import cursor
from settings import EducationDatabaseConfig

from ..connection import postgre_connection


class TeacherRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def auth(self, login: str, password: str, curs: cursor = None) -> int | None:
        query = """
            SELECT id
            FROM teachers
            WHERE login = %s
            AND password = %s
            """
        curs.execute(query, (login, password))
        row = curs.fetchone()
        teacher_id = row[0] if row else None
        return teacher_id

    @postgre_connection(__config)
    def is_login_already_used(self, login: str, curs: cursor = None) -> bool:
        query = """
            SELECT 1
            FROM teachers
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
        curs: cursor = None,
    ) -> int:
        # NEW FUNCTIONALITY: регистрация (создание) преподавателя
        query = """
            INSERT INTO teachers (login, password, first_name, last_name)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """
        curs.execute(query, (login, password, first_name, last_name))
        return int(curs.fetchone()[0])

    @postgre_connection(__config)
    def delete(self, teacher_id: int, curs: cursor = None) -> bool:
        # NEW FUNCTIONALITY: удаление преподавателя
        query = """
            DELETE FROM teachers
            WHERE id = %s
            RETURNING id
            """
        curs.execute(query, (teacher_id,))
        return bool(curs.fetchone())

    @postgre_connection(__config)
    def get_by_id(self, teacher_id: int, curs: cursor = None) -> tuple[int, str, str, str] | None:
        # NEW FUNCTIONALITY: получение данных преподавателя
        query = """
            SELECT id, login, first_name, last_name
            FROM teachers
            WHERE id = %s
            """
        curs.execute(query, (teacher_id,))
        row = curs.fetchone()
        return row if row else None

    @postgre_connection(__config)
    def get_first_and_last_names(self, teacher_id: int, curs: cursor = None) -> tuple[str, str]:
        query = """
            SELECT first_name, last_name
            FROM teachers
            WHERE id = %s
            """
        curs.execute(query, (teacher_id,))
        first_name, last_name = curs.fetchone()
        return first_name, last_name
