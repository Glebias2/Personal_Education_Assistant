from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Sequence

if TYPE_CHECKING:
    from agents.exam.exam_agent import ExamAgent


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
