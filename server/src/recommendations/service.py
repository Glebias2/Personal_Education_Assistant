"""RecommendationService — оркестрация всех сигналов рекомендательной системы.

Объединяет данные из БД (materialized view + дополнительные запросы)
с вычислениями из signals.py и semantic.py в итоговый рейтинг курсов.

Архитектура:
    1. Получаем базовые метрики из course_ranking_stats MV (enrollment, rating, richness, freshness)
    2. Вычисляем tag_match для каждого курса-кандидата
    3. Запрашиваем collaborative signal (ко-зачисление)
    4. Запрашиваем engagement signal (активность чатов)
    5. Получаем semantic signal (characteristic ↔ descriptions через t2v-transformers)
    6. Объединяем в composite_score и возвращаем отсортированный список
"""
import time
from psycopg2.extensions import cursor as PgCursor

from settings import EducationDatabaseConfig
from database.sql.connection import postgre_connection
from database.sql.repositories.recommendations import RecommendationRepository

from .queries import (
    get_collaborative_scores,
    get_engagement_scores,
    get_student_characteristic,
    get_course_descriptions,
)
from .signals import (
    normalize,
    tag_match_ratio,
    popularity_score,
    quality_score,
    composite_score,
)
from .semantic import get_semantic_scores

_config = EducationDatabaseConfig()

# TTL для обновления materialized view (10 минут)
_mv_last_refresh: float = 0.0
_MV_REFRESH_TTL: float = 600.0


class RecommendationService:
    """Сервис ранжирования курсов для конкретного студента.

    Инкапсулирует всю логику рекомендаций: запросы к БД, вычисление сигналов,
    финальное скоринг и сортировку. Endpoint вызывает только get_ranked_courses().
    """

    def __init__(self) -> None:
        self._repo = RecommendationRepository()

    @postgre_connection(_config)
    def _get_base_metrics(
        self,
        student_id: int,
        limit: int,
        curs: PgCursor = None,
    ) -> list[dict]:
        """Получает базовые метрики из materialized view + теги.

        Обновляет MV не чаще чем раз в _MV_REFRESH_TTL секунд.
        Исключает курсы, на которые студент уже записан.
        """
        global _mv_last_refresh
        now = time.time()
        if now - _mv_last_refresh > _MV_REFRESH_TTL:
            try:
                curs.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY course_ranking_stats")
            except Exception:
                # Если индекс ещё не создан — fallback на обычный REFRESH
                curs.execute("REFRESH MATERIALIZED VIEW course_ranking_stats")
            _mv_last_refresh = now

        query = """
            WITH max_vals AS (
                SELECT
                    GREATEST(MAX(enrollment_count), 1)   AS max_enr,
                    GREATEST(MAX(content_richness), 0.01) AS max_cr
                FROM course_ranking_stats
            )
            SELECT
                crs.course_id,
                c.title,
                c.description,
                crs.difficulty,
                c.created_at,
                crs.enrollment_count,
                crs.bayesian_rating,
                crs.content_richness,
                crs.freshness,
                mv.max_enr,
                mv.max_cr
            FROM course_ranking_stats crs
            JOIN courses c ON c.id = crs.course_id
            CROSS JOIN max_vals mv
            WHERE crs.course_id NOT IN (
                SELECT course_id FROM students_courses WHERE student_id = %s
            )
            LIMIT %s
        """
        curs.execute(query, (student_id, limit))
        rows = curs.fetchall()

        # Загружаем теги одним запросом
        course_ids = [r[0] for r in rows]
        tags_map: dict[int, list[str]] = {}
        if course_ids:
            curs.execute(
                "SELECT course_id, tag FROM course_tags WHERE course_id = ANY(%s)",
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
                "created_at": row[4],
                "enrollment_count": row[5],
                "bayesian_rating": float(row[6]),
                "content_richness": float(row[7]),
                "freshness": float(row[8]),
                "max_enr": float(row[9]),
                "max_cr": float(row[10]),
                "tags": tags_map.get(row[0], []),
            }
            for row in rows
        ]

    def get_ranked_courses(
        self,
        student_id: int,
        limit: int = 50,
    ) -> list[dict]:
        """Возвращает отсортированный список курсов с composite score.

        Каждый элемент содержит поля id, title, description, difficulty,
        tags, score, tag_match для использования в API-ответе.
        """
        base_metrics = self._get_base_metrics(student_id, limit)
        if not base_metrics:
            return []

        course_ids = [c["id"] for c in base_metrics]

        # Интересы студента для tag_match
        interests = self._repo.get_student_interests(student_id)

        # Дополнительные сигналы (возвращают dict[course_id -> value])
        collaborative_raw = get_collaborative_scores(student_id, course_ids)
        engagement_raw    = get_engagement_scores(course_ids)

        # Нормализуем collaborative и engagement до [0, 1]
        collaborative_norm = normalize(collaborative_raw)
        engagement_norm    = normalize(engagement_raw)

        # Семантический сигнал
        descriptions = get_course_descriptions(course_ids)
        characteristic = get_student_characteristic(student_id)
        semantic_scores = get_semantic_scores(characteristic, descriptions)

        # Нормализуем content_richness
        max_cr = max((c["max_cr"] for c in base_metrics), default=0.01)

        scored: list[dict] = []
        for course in base_metrics:
            cid = course["id"]

            pop   = popularity_score(course["enrollment_count"], course["max_enr"])
            qual  = quality_score(course["bayesian_rating"])
            tm    = tag_match_ratio(course["tags"], interests)
            collab = collaborative_norm.get(cid, 0.0)
            sem   = semantic_scores.get(cid, 0.0)
            fresh = course["freshness"]
            cont  = course["content_richness"] / max_cr if max_cr > 0 else 0.0
            eng   = engagement_norm.get(cid, 0.0)

            score = composite_score(
                popularity=pop,
                quality=qual,
                tag_match=tm,
                collaborative=collab,
                semantic=sem,
                freshness=fresh,
                content=cont,
                engagement=eng,
            )

            scored.append({
                "id": cid,
                "title": course["title"],
                "description": course["description"],
                "difficulty": course["difficulty"],
                "tags": course["tags"],
                "score": round(score, 4),
                "tag_match": round(tm, 2),
                "bayesian_rating": course["bayesian_rating"],
                "enrollment_count": course["enrollment_count"],
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored
