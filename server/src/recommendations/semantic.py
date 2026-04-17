"""Семантическое сопоставление через t2v-transformers.

Использует inference API контейнера t2v-transformers (paraphrase-multilingual-MiniLM-L12-v2)
напрямую — без Weaviate. Это позволяет получить эмбеддинги для произвольного текста
(характеристика студента, описание курса) и вычислить косинусное сходство.

Контейнер доступен внутри Docker-сети по адресу http://t2v-transformers:8080.
Endpoint: POST /vectors с телом {"text": "..."}
Ответ: {"text": "...", "vector": [...], "dim": 384}
"""
import json
import math
import urllib.request
from urllib.error import URLError


_T2V_URL = "http://t2v-transformers:8080/vectors"
_REQUEST_TIMEOUT = 5  # секунд


def get_embedding(text: str) -> list[float] | None:
    """Запрашивает вектор у t2v-transformers API.

    Возвращает список float или None при любой ошибке (сеть, таймаут, формат).
    Ошибки не пробрасываются — семантический сигнал просто не учитывается.
    """
    if not text or not text.strip():
        return None
    try:
        payload = json.dumps({"text": text}).encode("utf-8")
        req = urllib.request.Request(
            _T2V_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=_REQUEST_TIMEOUT) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            vector = body.get("vector")
            if isinstance(vector, list) and vector:
                return vector
            return None
    except (URLError, TimeoutError, json.JSONDecodeError, KeyError, Exception):
        return None


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Косинусное сходство двух векторов. Результат в [-1, 1]."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def get_semantic_scores(
    characteristic: str | None,
    course_descriptions: dict[int, str],
) -> dict[int, float]:
    """Вычисляет семантическую близость характеристики студента к описаниям курсов.

    Args:
        characteristic: Текстовая характеристика студента (может быть None).
        course_descriptions: dict[course_id -> description].

    Returns:
        dict[course_id -> similarity] где similarity ∈ [0, 1].
        Пустой dict если характеристика недоступна или API недоступен.
    """
    if not characteristic or not course_descriptions:
        return {}

    char_vec = get_embedding(characteristic)
    if char_vec is None:
        return {}

    result: dict[int, float] = {}
    for course_id, description in course_descriptions.items():
        if not description:
            continue
        desc_vec = get_embedding(description)
        if desc_vec is None:
            continue
        sim = cosine_similarity(char_vec, desc_vec)
        # Косинусное сходство может быть отрицательным — обрезаем до 0
        result[course_id] = max(0.0, sim)

    return result
