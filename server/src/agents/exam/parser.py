from __future__ import annotations

import json
import re
from typing import Any, Iterable

from models.exam import ExamQuestion


def parse_question_payload(payload: Any) -> list[ExamQuestion]:
    """
    Приводит произвольный ответ LLM или сохраненный JSON к списку ExamQuestion.

    Поддерживает строки, словари с ключом questions/items и массивы строк/объектов.
    """
    data: Iterable[Any] | None

    if payload is None:
        return []

    if isinstance(payload, str):
        clean_payload = _strip_code_fence(payload)
        if not clean_payload:
            return []
        try:
            loaded = json.loads(clean_payload)
        except json.JSONDecodeError:
            numbered_questions = _split_numbered_questions(clean_payload)
            if numbered_questions:
                return numbered_questions

            lines = [
                line.strip(" -*\t")
                for line in clean_payload.splitlines()
                if line.strip()
            ]
            return [
                ExamQuestion(id=index, text=line)
                for index, line in enumerate(lines, start=1)
            ]
        data = loaded
    else:
        data = payload

    if isinstance(data, dict):
        items = data.get("questions") or data.get("items")
        if not isinstance(items, Iterable):
            return []
        data = items

    if not isinstance(data, Iterable):
        return []

    questions: list[ExamQuestion] = []
    for index, item in enumerate(data, start=1):
        if isinstance(item, str):
            text = item.strip()
            if text:
                questions.append(ExamQuestion(id=index, text=text))
            continue

        if isinstance(item, dict):
            text = (
                item.get("question")
                or item.get("text")
                or item.get("prompt")
                or ""
            )
            text = text.strip()
            if not text:
                continue

            reference = (
                item.get("reference_answer")
                or item.get("answer")
                or item.get("reference")
            )
            if isinstance(reference, str):
                reference = reference.strip() or None
            else:
                reference = None

            questions.append(
                ExamQuestion(
                    id=index,
                    text=text,
                    reference_answer=reference,
                )
            )

    return questions


def coerce_to_text(response: Any) -> str:
    """Безопасно приводит объект ответа LLM к строке."""
    if response is None:
        return ""
    if hasattr(response, "content"):
        return str(getattr(response, "content"))
    return str(response)


def _split_numbered_questions(text: str) -> list[ExamQuestion]:
    """Разделяет текст на вопросы по нумерованным паттернам (1., 2., 3. и т.д.)."""
    pattern = r'\b(\d+\.\s+)'
    matches = list(re.finditer(pattern, text))

    if len(matches) == 0:
        return []

    questions: list[ExamQuestion] = []

    for i, match in enumerate(matches):
        start_pos = match.start()

        if i + 1 < len(matches):
            end_pos = matches[i + 1].start()
        else:
            end_pos = len(text)

        question_text = text[start_pos:end_pos].strip()
        question_text = re.sub(r'^\d+\.\s*', '', question_text).strip()

        if question_text:
            questions.append(ExamQuestion(id=i + 1, text=question_text))

    return questions if questions else []


def _strip_code_fence(text: str) -> str:
    """Убирает обрамление в стиле Markdown ```lang ... ``` и триммирует текст."""
    trimmed = text.strip()
    if trimmed.startswith("```"):
        trimmed = re.sub(r"^```[a-zA-Z0-9]*\n?", "", trimmed)
        trimmed = re.sub(r"\n?```$", "", trimmed)
    return trimmed.strip()


def safe_json_parse(raw: str) -> Any:
    """Пытается распарсить строку как JSON, иначе возвращает исходное значение."""
    clean_payload = _strip_code_fence(raw)
    if not clean_payload:
        return raw
    try:
        return json.loads(clean_payload)
    except json.JSONDecodeError:
        return raw
