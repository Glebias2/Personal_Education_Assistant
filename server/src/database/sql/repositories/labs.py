from psycopg2.extensions import cursor

from models.lab import NewLab

from settings import EducationDatabaseConfig
from ..connection import postgre_connection


class LabRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def get_labs(self, course_id: int, curs: cursor = None) -> list[tuple[int, int, str, str]]:
        query = """
            SELECT id, number, title, task
            FROM labs
            WHERE course_id = %s
            """
        curs.execute(query, (course_id,))
        labs = curs.fetchall()
        return labs

    @postgre_connection(__config)
    def get_by_id(self, lab_id: int, curs: cursor = None) -> tuple[int, int, str, str | None, int] | None:
        # NEW FUNCTIONALITY: получение лабораторной по id
        query = """
            SELECT id, number, title, task, course_id
            FROM labs
            WHERE id = %s
            """
        curs.execute(query, (lab_id,))
        row = curs.fetchone()
        return row if row else None

    @postgre_connection(__config)
    def get_lab_task(self, lab_id: int, curs: cursor = None) -> str | None:
        query = """
            SELECT task
            FROM labs
            WHERE id = %s
            """
        curs.execute(query, (lab_id,))
        row = curs.fetchone()
        return row[0] if row else None

    @postgre_connection(__config)
    def create(self, lab: NewLab, course_id: int, curs: cursor = None) -> None:
        # NEW FUNCTIONALITY: создание лабораторной
        query = """
            INSERT INTO labs
            (number, title, task, course_id)
            VALUES (%s, %s, %s, %s)
            """
        curs.execute(query, (lab.number, lab.title, lab.task, course_id))

    @postgre_connection(__config)
    def update(self, lab_id: int, *, number: int, title: str, task: str | None, curs: cursor = None) -> bool:
        # NEW FUNCTIONALITY: обновление лабораторной (для совместимости с текущим фронтом)
        query = """
            UPDATE labs
            SET number = %s, title = %s, task = %s
            WHERE id = %s
            RETURNING id
            """
        curs.execute(query, (number, title, task, lab_id))
        return bool(curs.fetchone())

    @postgre_connection(__config)
    def delete(self, lab_id: int, curs: cursor = None) -> bool:
        # NEW FUNCTIONALITY: удаление лабораторной
        query = """
            DELETE FROM labs
            WHERE id = %s
            RETURNING id
            """
        curs.execute(query, (lab_id,))
        return bool(curs.fetchone())
