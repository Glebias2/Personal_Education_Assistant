import time
from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection

# TTL для обновления materialized view (10 минут)
_mv_last_refresh: float = 0.0
_MV_REFRESH_TTL: float = 600.0


class RecommendationRepository:
    __config = EducationDatabaseConfig()

    # ── Интересы студентов ────────────────────────────────────────────────────

    @postgre_connection(__config)
    def set_student_interests(self, student_id: int, tags: list[str], curs: cursor = None) -> None:
        curs.execute("DELETE FROM student_interests WHERE student_id = %s", (student_id,))
        for tag in tags:
            curs.execute(
                "INSERT INTO student_interests (student_id, tag) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (student_id, tag),
            )

    @postgre_connection(__config)
    def get_student_interests(self, student_id: int, curs: cursor = None) -> list[str]:
        curs.execute("SELECT tag FROM student_interests WHERE student_id = %s ORDER BY tag", (student_id,))
        return [row[0] for row in curs.fetchall()]

    # ── Теги курсов ───────────────────────────────────────────────────────────

    @postgre_connection(__config)
    def set_course_tags(self, course_id: int, tags: list[str], curs: cursor = None) -> None:
        curs.execute("DELETE FROM course_tags WHERE course_id = %s", (course_id,))
        for tag in tags:
            curs.execute(
                "INSERT INTO course_tags (course_id, tag) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (course_id, tag),
            )

    @postgre_connection(__config)
    def get_course_tags(self, course_id: int, curs: cursor = None) -> list[str]:
        curs.execute("SELECT tag FROM course_tags WHERE course_id = %s ORDER BY tag", (course_id,))
        return [row[0] for row in curs.fetchall()]

    @postgre_connection(__config)
    def get_all_course_tags(self, curs: cursor = None) -> dict[int, list[str]]:
        curs.execute("SELECT course_id, tag FROM course_tags ORDER BY course_id, tag")
        result: dict[int, list[str]] = {}
        for course_id, tag in curs.fetchall():
            result.setdefault(course_id, []).append(tag)
        return result

    # ── Materialized View ─────────────────────────────────────────────────────

    @postgre_connection(__config)
    def refresh_ranking_stats(self, curs: cursor = None) -> None:
        curs.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY course_ranking_stats")

    # ── Рекомендации ──────────────────────────────────────────────────────────

    @postgre_connection(__config)
    def get_recommended_courses(self, student_id: int, limit: int = 50, curs: cursor = None) -> list[dict]:
        # Обновляем MV только если прошло более 10 минут (TTL-кэш)
        global _mv_last_refresh
        now = time.time()
        if now - _mv_last_refresh > _MV_REFRESH_TTL:
            curs.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY course_ranking_stats")
            _mv_last_refresh = now

        query = """
            WITH max_vals AS (
                SELECT
                    GREATEST(MAX(enrollment_count), 1) AS max_enr,
                    GREATEST(MAX(content_richness), 0.01) AS max_cr
                FROM course_ranking_stats
            ),
            tag_match AS (
                SELECT
                    ct.course_id,
                    COUNT(*) FILTER (WHERE si.tag IS NOT NULL)::float
                        / GREATEST(COUNT(ct.tag), 1) AS ratio
                FROM course_tags ct
                LEFT JOIN student_interests si
                    ON si.student_id = %s AND si.tag = ct.tag
                GROUP BY ct.course_id
            )
            SELECT
                crs.course_id,
                crs.title,
                c.description,
                crs.difficulty,
                crs.enrollment_count,
                crs.bayesian_rating,
                COALESCE(tm.ratio, 0) AS tag_match_ratio,
                -- composite score
                0.30 * (crs.enrollment_count::float / mv.max_enr)
                + 0.25 * (crs.bayesian_rating / 5.0)
                + 0.25 * COALESCE(tm.ratio, 0)
                + 0.10 * crs.freshness
                + 0.10 * (crs.content_richness / mv.max_cr)
                AS score
            FROM course_ranking_stats crs
            JOIN courses c ON c.id = crs.course_id
            CROSS JOIN max_vals mv
            LEFT JOIN tag_match tm ON tm.course_id = crs.course_id
            WHERE crs.course_id NOT IN (
                SELECT course_id FROM students_courses WHERE student_id = %s
            )
            ORDER BY score DESC
            LIMIT %s
        """
        curs.execute(query, (student_id, student_id, limit))
        rows = curs.fetchall()

        # Собираем теги для каждого курса
        course_ids = [r[0] for r in rows]
        tags_map: dict[int, list[str]] = {}
        if course_ids:
            curs.execute(
                "SELECT course_id, tag FROM course_tags WHERE course_id = ANY(%s) ORDER BY course_id, tag",
                (course_ids,),
            )
            for cid, tag in curs.fetchall():
                tags_map.setdefault(cid, []).append(tag)

        return [
            {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "difficulty": row[3],
                "enrollment_count": row[4],
                "bayesian_rating": round(row[5], 2),
                "tag_match": round(row[6], 2),
                "score": round(row[7], 4),
                "tags": tags_map.get(row[0], []),
            }
            for row in rows
        ]

    # ── Рейтинги ──────────────────────────────────────────────────────────────

    @postgre_connection(__config)
    def rate_course(self, student_id: int, course_id: int, rating: int, curs: cursor = None) -> None:
        curs.execute(
            """
            INSERT INTO course_ratings (student_id, course_id, rating)
            VALUES (%s, %s, %s)
            ON CONFLICT (student_id, course_id)
            DO UPDATE SET rating = EXCLUDED.rating, created_at = NOW()
            """,
            (student_id, course_id, rating),
        )

    @postgre_connection(__config)
    def get_course_rating(self, student_id: int, course_id: int, curs: cursor = None) -> int | None:
        curs.execute(
            "SELECT rating FROM course_ratings WHERE student_id = %s AND course_id = %s",
            (student_id, course_id),
        )
        row = curs.fetchone()
        return row[0] if row else None
