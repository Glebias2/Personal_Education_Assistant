from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection

_config = EducationDatabaseConfig()


@postgre_connection(_config)
def _alter_courses_add_recommendation_columns(curs: cursor = None) -> None:
    curs.execute("ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT")
    curs.execute("""
        ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty TEXT
            NOT NULL DEFAULT 'intermediate'
    """)
    curs.execute("""
        ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at
            TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    """)


@postgre_connection(_config)
def _create_table_course_tags(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS course_tags (
            id SERIAL PRIMARY KEY,
            course_id INT NOT NULL,
            tag TEXT NOT NULL,
            UNIQUE (course_id, tag),
            CONSTRAINT fk_course_tags_course
                FOREIGN KEY (course_id)
                REFERENCES courses (id)
                ON DELETE CASCADE
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_student_interests(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS student_interests (
            id SERIAL PRIMARY KEY,
            student_id INT NOT NULL,
            tag TEXT NOT NULL,
            UNIQUE (student_id, tag),
            CONSTRAINT fk_student_interests_student
                FOREIGN KEY (student_id)
                REFERENCES students (id)
                ON DELETE CASCADE
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_table_course_ratings(curs: cursor = None) -> None:
    query = """
        CREATE TABLE IF NOT EXISTS course_ratings (
            id SERIAL PRIMARY KEY,
            student_id INT NOT NULL,
            course_id INT NOT NULL,
            rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE (student_id, course_id),
            CONSTRAINT fk_course_ratings_student
                FOREIGN KEY (student_id)
                REFERENCES students (id)
                ON DELETE CASCADE,
            CONSTRAINT fk_course_ratings_course
                FOREIGN KEY (course_id)
                REFERENCES courses (id)
                ON DELETE CASCADE
        )
    """
    curs.execute(query)


@postgre_connection(_config)
def _create_materialized_view_ranking_stats(curs: cursor = None) -> None:
    curs.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_matviews WHERE matviewname = 'course_ranking_stats'
            ) THEN
                EXECUTE '
                CREATE MATERIALIZED VIEW course_ranking_stats AS
                SELECT
                    c.id AS course_id,
                    c.title,
                    c.difficulty,
                    c.created_at,
                    COALESCE(enr.cnt, 0) AS enrollment_count,
                    COALESCE(
                        (rat.vote_count::float / (rat.vote_count + 3))
                            * rat.avg_rating
                        + (3.0 / (rat.vote_count + 3))
                            * COALESCE(global_avg.avg, 3.0),
                        3.0
                    ) AS bayesian_rating,
                    LN(1 + COALESCE(files.cnt, 0))
                        * LN(1 + COALESCE(lab.cnt, 0)) AS content_richness,
                    1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - c.created_at))
                        / 86400.0 / 30.0) AS freshness
                FROM courses c
                LEFT JOIN (
                    SELECT course_id, COUNT(*) AS cnt
                    FROM students_courses GROUP BY course_id
                ) enr ON enr.course_id = c.id
                LEFT JOIN (
                    SELECT course_id,
                           COUNT(*) AS vote_count,
                           AVG(rating) AS avg_rating
                    FROM course_ratings GROUP BY course_id
                ) rat ON rat.course_id = c.id
                LEFT JOIN (
                    SELECT course_id, COUNT(*) AS cnt
                    FROM course_files GROUP BY course_id
                ) files ON files.course_id = c.id
                LEFT JOIN (
                    SELECT course_id, COUNT(*) AS cnt
                    FROM labs GROUP BY course_id
                ) lab ON lab.course_id = c.id
                CROSS JOIN (
                    SELECT COALESCE(AVG(rating), 3.0) AS avg
                    FROM course_ratings
                ) global_avg';
            END IF;
        END $$;
    """)
    # Уникальный индекс нужен для REFRESH MATERIALIZED VIEW CONCURRENTLY
    curs.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_course_ranking_stats_pk
        ON course_ranking_stats (course_id)
    """)


def create_recommendations_tables():
    _alter_courses_add_recommendation_columns()
    _create_table_course_tags()
    _create_table_student_interests()
    _create_table_course_ratings()
    _create_materialized_view_ranking_stats()
