from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any, Iterable, Sequence

from  database.sql import CourseRepository
from .llm import llm

QUESTION_GENERATION_PROMPT = """
Ты ассистент по подготовке к экзамену. В записи курса хранятся материалы для экзаменационных вопросов.
Используя предоставленный блок экзаменационных материалов, подготовь {question_count} сфокусированных письменных вопросов для студента.
Соответствуй темам из блока. Один вопрос на элемент списка.

Верни только валидный JSON:
[
  {{
    "question": "текст вопроса на {language}",
    "reference_answer": "идеальный краткий ответ или критерии оценки (необязательно)"
  }}
]
""".strip()

ANSWER_EVALUATION_PROMPT = """
Ты экзаменатор. Оцени письменный ответ студента.
Используй вопрос, ответ студента и опциональное эталонное руководство.
Если эталонный ответ пуст, опирайся на контекст курса.

Отвечай на {language} и верни JSON следующей структуры:
{{
  "verdict": "краткая однофразовая оценка",
  "issues": ["список конкретных проблем или пустой список"],
  "recommendation": "практический совет для улучшения ответа",
  "score": "числовая оценка от 0 до 100 или null, если оценка невозможна"
}}

Контекст курса:
{context}

Вопрос:
{question}

Эталонный ответ:
{reference_answer}

Ответ студента:
{student_answer}
""".strip()


@dataclass(slots=True)
class ExamQuestion:
    """Модель одного экзаменационного вопроса."""

    id: int
    text: str
    reference_answer: str | None = None


@dataclass(slots=True)
class ExamResult:
    """Результат проверки ответа студента."""

    question: ExamQuestion
    user_answer: str
    verdict: str
    recommendation: str
    issues: list[str] = field(default_factory=list)
    score: str | None = None
    raw_feedback: str | None = None


class ExamSession:
    """Помощник, который проводит студента через экзамен."""

    def __init__(
        self,
        agent: ExamAgent,
        *,
        questions: Sequence[ExamQuestion],
        context: str,
        language: str = "ru",
    ) -> None:
        self._agent = agent
        self._context = context
        self._language = language
        self._questions = list(questions)
        self._cursor = 0
        self._active_question: ExamQuestion | None = None
        self.results: list[ExamResult] = []

    def has_next_question(self) -> bool:
        """Возвращает True, если в экзамене есть еще не заданные вопросы."""
        return self._cursor < len(self._questions)

    def next_question(self) -> ExamQuestion:
        """Возвращает следующий вопрос экзамена или выбрасывает StopIteration."""
        if not self.has_next_question():
            raise StopIteration("В этом экзамене больше нет вопросов.")
        question = self._questions[self._cursor]
        self._cursor += 1
        self._active_question = question
        return question

    def submit_answer(self, answer: str) -> ExamResult:
        """Оценивает ответ студента на активный вопрос и сбрасывает активный вопрос."""
        if self._active_question is None:
            raise ValueError("Нет активного вопроса для оценки.")
        result = self._agent.evaluate_answer(
            question=self._active_question,
            answer=answer,
            context=self._context,
            language=self._language,
        )
        self.results.append(result)
        self._active_question = None
        return result


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
        raw_response = self._coerce_to_text(llm.invoke(prompt))
        parsed = self._safe_json_parse(raw_response)

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
        parsed_from_context = self._parse_question_payload(context)
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
        raw_response = self._coerce_to_text(llm.invoke(prompt))
        return self._parse_question_payload(raw_response)

    def _parse_question_payload(self, payload: Any) -> list[ExamQuestion]:
        """
        Приводит произвольный ответ LLM или сохраненный JSON к списку ExamQuestion.

        Поддерживает строки, словари с ключом questions/items и массивы строк/объектов.
        """
        data: Iterable[Any] | None

        if payload is None:
            return []

        if isinstance(payload, str):
            clean_payload = self._strip_code_fence(payload)
            if not clean_payload:
                return []
            try:
                loaded = json.loads(clean_payload)
            except json.JSONDecodeError:
                # Попытка разделить по нумерованным паттернам (1., 2., 3. и т.д.)
                numbered_questions = self._split_numbered_questions(clean_payload)
                if numbered_questions:
                    return numbered_questions  
                
                # Если не получилось, пробуем разделить по строкам
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

    @staticmethod
    def _coerce_to_text(response: Any) -> str:
        """Безопасно приводит объект ответа LLM к строке."""
        if response is None:
            return ""
        if hasattr(response, "content"):
            return str(getattr(response, "content"))
        return str(response)

    @staticmethod
    def _split_numbered_questions(text: str) -> list[ExamQuestion]:
        """Разделяет текст на вопросы по нумерованным паттернам (1., 2., 3. и т.д.)."""
        # Паттерн для поиска начала нумерованных вопросов: число, точка, пробел
        # Поддерживает форматы: "1. ", "2. ", "10. " и т.д.
        pattern = r'\b(\d+\.\s+)'
        
        # Находим все позиции начала вопросов
        matches = list(re.finditer(pattern, text))
        
        if len(matches) == 0:  # Нет нумерованных вопросов
            return []
        
        questions: list[ExamQuestion] = []
        
        # Разделяем текст по позициям начала вопросов
        for i, match in enumerate(matches):
            start_pos = match.start()
            
            # Определяем конец текущего вопроса (начало следующего или конец текста)
            if i + 1 < len(matches):
                end_pos = matches[i + 1].start()
            else:
                end_pos = len(text)
            
            # Извлекаем текст вопроса (без номера в начале)
            question_text = text[start_pos:end_pos].strip()
            # Убираем номер из начала вопроса
            question_text = re.sub(r'^\d+\.\s*', '', question_text).strip()
            
            if question_text:
                questions.append(ExamQuestion(id=i + 1, text=question_text))
        
        return questions if questions else []

    @staticmethod
    def _strip_code_fence(text: str) -> str:
        """Убирает обрамление в стиле Markdown ```lang ... ``` и триммирует текст."""
        trimmed = text.strip()
        if trimmed.startswith("```"):
            trimmed = re.sub(r"^```[a-zA-Z0-9]*\n?", "", trimmed)
            trimmed = re.sub(r"\n?```$", "", trimmed)
        return trimmed.strip()

    @staticmethod
    def _safe_json_parse(raw: str) -> Any:
        """Пытается распарсить строку как JSON, иначе возвращает исходное значение."""
        clean_payload = ExamAgent._strip_code_fence(raw)
        if not clean_payload:
            return raw
        try:
            return json.loads(clean_payload)
        except json.JSONDecodeError:
            return raw
