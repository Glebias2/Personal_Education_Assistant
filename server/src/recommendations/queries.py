"""SQL-запросы для дополнительных сигналов рекомендательной системы.

Каждая функция принимает psycopg2-курсор и возвращает чистые данные.
Логика вынесена сюда, чтобы endpoint и сервис не содержали SQL.
"""
from psycopg2.extensions import cursor as PgCursor

from settings import EducationDatabaseConfig
from database.sql.connection import postgre_connection

_config = EducationDatabaseConfig()


@postgre_connection(_config)
def get_collaborative_scores(
    student_id: int,
    candidate_course_ids: list[int],
    curs: PgCursor = None,
) -> dict[int, float]:
    """Collaborative filtering: ко-зачисление.

    Возвращает dict[course_id -> co_enrollment_count] для кандидатов.
    Сигнал: «студенты, записанные на те же курсы, что и данный студент,
    также записались на эти курсы».
    """
    if not candidate_course_ids:
        return {}

    query = """
        SELECT sc2.course_id, COUNT(DISTINCT sc2.student_id)::float AS co_count
        FROM students_courses sc1
        JOIN students_courses sc2
            ON sc1.student_id = sc2.student_id
            AND sc2.course_id != sc1.course_id
        WHERE sc1.course_id IN (
            SELECT course_id FROM students_courses WHERE student_id = %s
        )
          AND sc2.course_id = ANY(%s)
        GROUP BY sc2.course_id
    """
    curs.execute(query, (student_id, candidate_course_ids))
    return {row[0]: row[1] for row in curs.fetchall()}


@postgre_connection(_config)
def get_engagement_scores(
    candidate_course_ids: list[int],
    curs: PgCursor = None,
) -> dict[int, float]:
    """Engagement signal: среднее количество сообщений студента на курс.

    Возвращает dict[course_id -> avg_messages_per_student].
    Высокое значение = курс активно обсуждается = косвенный признак качества.
    """
    if not candidate_course_ids:
        return {}

    query = """
        SELECT
            ch.course_id,
            COUNT(cm.id)::float / NULLIF(COUNT(DISTINCT ch.student_id), 0) AS avg_msgs
        FROM chats ch
        LEFT JOIN chat_messages cm
            ON cm.chat_id = ch.id AND cm.role = 'human'
        WHERE ch.course_id = ANY(%s)
        GROUP BY ch.course_id
    """
    curs.execute(query, (candidate_course_ids,))
    return {row[0]: row[1] for row in curs.fetchall()}


@postgre_connection(_config)
def get_student_characteristic(
    student_id: int,
    curs: PgCursor = None,
) -> str | None:
    """Возвращает текстовую характеристику студента или None."""
    curs.execute(
        "SELECT characteristic FROM students WHERE id = %s",
        (student_id,),
    )
    row = curs.fetchone()
    return row[0] if row and row[0] else None


@postgre_connection(_config)
def get_course_descriptions(
    course_ids: list[int],
    curs: PgCursor = None,
) -> dict[int, str]:
    """Возвращает dict[course_id -> description] для заданных курсов."""
    if not course_ids:
        return {}
    curs.execute(
        "SELECT id, description FROM courses WHERE id = ANY(%s) AND description IS NOT NULL",
        (course_ids,),
    )
    return {row[0]: row[1] for row in curs.fetchall()}
