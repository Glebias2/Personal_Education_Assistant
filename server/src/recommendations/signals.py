"""Чистые функции вычисления и нормализации сигналов рекомендательной системы.

Все функции stateless и не обращаются к БД напрямую — только вычисления.
"""
import math
from datetime import datetime


# ── Нормализация ──────────────────────────────────────────────────────────────

def normalize(values: dict[int, float]) -> dict[int, float]:
    """Min-max нормализация: приводит значения к диапазону [0, 1]."""
    if not values:
        return {}
    min_v = min(values.values())
    max_v = max(values.values())
    diff = max_v - min_v
    if diff == 0:
        return {k: 1.0 for k in values}
    return {k: (v - min_v) / diff for k, v in values.items()}


# ── Сигналы ───────────────────────────────────────────────────────────────────

def tag_match_ratio(course_tags: list[str], student_interests: list[str]) -> float:
    """Доля тегов курса, совпадающих с интересами студента.

    Возвращает значение в [0, 1]. Сравнение регистронезависимое.
    """
    if not course_tags or not student_interests:
        return 0.0
    interests_lower = {t.lower() for t in student_interests}
    matches = sum(1 for t in course_tags if t.lower() in interests_lower)
    return matches / len(course_tags)


def freshness_score(created_at: datetime | str | None) -> float:
    """Свежесть курса: экспоненциальное убывание по 30-дневным периодам.

    Новый курс (0 дней) → 1.0, курс возрастом 30 дней → ~0.5.
    """
    if created_at is None:
        return 0.5
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at)
        except ValueError:
            return 0.5
    days = (datetime.now() - created_at.replace(tzinfo=None)).days
    return 1.0 / (1.0 + days / 30.0)


def content_richness_score(files_cnt: int, labs_cnt: int) -> float:
    """Насыщённость курса контентом: логарифмическое произведение файлов и лаб."""
    return math.log1p(files_cnt) * math.log1p(labs_cnt)


def popularity_score(enrollment_count: int, max_enrollment: int) -> float:
    """Нормализованная популярность курса по количеству зачисленных."""
    if max_enrollment <= 0:
        return 0.0
    return enrollment_count / max_enrollment


def quality_score(bayesian_rating: float) -> float:
    """Качество курса на основе Bayesian-рейтинга (шкала 1–5) → [0, 1]."""
    return bayesian_rating / 5.0


# ── Итоговая формула ──────────────────────────────────────────────────────────

WEIGHTS = {
    "popularity":    0.05,   # снижен: не должен перебивать персонализацию
    "quality":       0.15,   # немного снижен в пользу tag_match
    "tag_match":     0.55,   # главный сигнал персонализации (+35pp к baseline)
    "collaborative": 0.09,   # пропорционально масштабирован
    "semantic":      0.06,   # пропорционально масштабирован
    "freshness":     0.04,   # пропорционально масштабирован
    "content":       0.03,   # пропорционально масштабирован
    "engagement":    0.03,   # пропорционально масштабирован
}


def composite_score(
    popularity: float,
    quality: float,
    tag_match: float,
    collaborative: float,
    semantic: float,
    freshness: float,
    content: float,
    engagement: float,
) -> float:
    """Итоговая взвешенная оценка курса для студента. Результат в [0, 1]."""
    return (
        WEIGHTS["popularity"]    * popularity
        + WEIGHTS["quality"]     * quality
        + WEIGHTS["tag_match"]   * tag_match
        + WEIGHTS["collaborative"] * collaborative
        + WEIGHTS["semantic"]    * semantic
        + WEIGHTS["freshness"]   * freshness
        + WEIGHTS["content"]     * content
        + WEIGHTS["engagement"]  * engagement
    )
