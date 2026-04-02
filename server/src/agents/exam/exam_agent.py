from __future__ import annotations

import json
import re
from typing import Any, Iterable

from database.sql import CourseRepository
from models.exam import ExamQuestion, ExamResult, ExamSession
from .llm import llm
from .prompts import QUESTION_GENERATION_PROMPT, ANSWER_EVALUATION_PROMPT
from .parser import parse_question_payload, coerce_to_text, safe_json_parse


class ExamAgent:
    """Агент экзамена, который получает вопросы из курса и оценивает ответы."""

    def create_session(
        self,
        *,
        course_id: int,
        question_count: int = 3,
        language: str = "ru",
    ) -> ExamSession:
        """
        Создает новый экзамен для курса.

        Поднимает ValueError, если у курса нет экзаменационного контекста или
        вопросы не удалось подготовить.
        """
        course_repository = CourseRepository()
        context = course_repository.get_exam_questions(course_id)
        if not context:
            raise ValueError(f"У курса №{course_id} нет сохраненных экзаменационных вопросов.")

        questions = self._prepare_questions(
            context=context,
            desired_count=question_count,
            language=language,
        )
        if not questions:
            raise ValueError("Не удалось сгенерировать вопросы из предоставленного контекста.")

        return ExamSession(
            agent=self,
            questions=questions,
            context=context,
            language=language,
        )

    def evaluate_answer(
        self,
        *,
        question: ExamQuestion,
        answer: str,
        context: str,
        language: str,
    ) -> ExamResult:
        """
        Оценивает ответ студента, используя LLM.

        Возвращает ExamResult с вердиктом, списком проблем и рекомендацией.
        Если LLM вернул не-JSON, исходный текст сохраняется в raw_feedback.
        """
        prompt = ANSWER_EVALUATION_PROMPT.format(
            language=language,
            context=context,
            question=question.text,
            reference_answer=question.reference_answer or "",
            student_answer=answer,
        )
        raw_response = coerce_to_text(llm.invoke(prompt))
        parsed = safe_json_parse(raw_response)

        verdict = parsed.get("verdict") if isinstance(parsed, dict) else None
        recommendation = parsed.get("recommendation") if isinstance(parsed, dict) else None
        issues = parsed.get("issues") if isinstance(parsed, dict) else None
        score = parsed.get("score") if isinstance(parsed, dict) else None

        result = ExamResult(
            question=question,
            user_answer=answer,
            verdict=verdict or raw_response,
            recommendation=recommendation or "",
            issues=list(issues or []),
            score=str(score) if score is not None else None,
            raw_feedback=raw_response,
        )
        if not result.recommendation:
            result.recommendation = "Пересмотри вопрос еще раз и уточни ключевые концепции в своем ответе."
        return result

    def _prepare_questions(
        self,
        *,
        context: str,
        desired_count: int,
        language: str,
    ) -> list[ExamQuestion]:
        """
        Возвращает набор вопросов из сохраненного контекста или генерирует их через LLM.

        Приоритет: распарсить готовую структуру в контексте, затем попытаться сгенерировать
        новые вопросы. Возвращает не более desired_count.
        """
        parsed_from_context = parse_question_payload(context)
        if parsed_from_context:
            return parsed_from_context[:desired_count]

        generated = self._generate_questions_with_llm(
            context=context,
            question_count=desired_count,
            language=language,
        )
        if generated:
            return generated[:desired_count]

        return []

    def _generate_questions_with_llm(
        self,
        *,
        context: str,
        question_count: int,
        language: str,
    ) -> list[ExamQuestion]:
        """Генерирует список вопросов с помощью LLM на основе контекста курса."""
        prompt = QUESTION_GENERATION_PROMPT.format(
            question_count=question_count,
            language=language,
        ) + "\n\n" + context
        raw_response = coerce_to_text(llm.invoke(prompt))
        return parse_question_payload(raw_response)
