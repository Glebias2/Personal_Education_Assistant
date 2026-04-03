from __future__ import annotations
from uuid import uuid4

from fastapi import Body, HTTPException, Path, Query, status
from pydantic import BaseModel, Field

from agents.exam.exam_agent import ExamAgent
from models.exam import ExamQuestion, ExamResult, ExamSession
from database.sql.repositories.exam_results import ExamResultRepository

from ..app import app


_exam_agent = ExamAgent()


def _get_exam_store() -> dict[str, tuple[int, int, ExamSession]]:
    """Возвращает хранилище экзаменов, лениво инициализируя его в app.state.
    Формат: exam_id -> (course_id, student_id, session)
    """
    state = getattr(app.state, "exams", None)
    if state is None:
        state = {}
        app.state.exams = state
    return state


@app.on_event("startup")
def _bootstrap_exams() -> None:
    """Инициализирует пустое хранилище экзаменов при старте приложения."""
    _get_exam_store()


class ExamQuestionPayload(BaseModel):
    """Схема вопроса для отдачи клиенту."""

    id: int
    text: str
    reference_answer: str | None = None


class StartExamRequest(BaseModel):
    """Тело запроса на старт экзамена."""

    student_id: int = Field(..., ge=1)
    question_count: int = Field(default=3, ge=1, le=20)
    language: str = Field(default="ru", min_length=2, max_length=8)


class StartExamResponse(BaseModel):
    """Ответ при создании экзамена: ID и первый вопрос."""

    exam_id: str
    question: ExamQuestionPayload
    has_more_questions: bool


class SubmitAnswerRequest(BaseModel):
    """Тело запроса с ответом студента для проверки."""

    exam_id: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)


class ExamResultPayload(BaseModel):
    """Схема результата проверки одного ответа."""

    question_id: int
    question_text: str
    user_answer: str
    verdict: str
    recommendation: str
    issues: list[str]
    score: str | None = None
    raw_feedback: str | None = None


class SubmitAnswerResponse(BaseModel):
    """Ответ на отправку ответа: оценка и следующий вопрос, если он есть."""

    evaluation: ExamResultPayload
    next_question: ExamQuestionPayload | None = None
    has_more_questions: bool = False
    completed: bool = False


class ExamSummaryResponse(BaseModel):
    """Сводка по экзамену: список результатов и статус завершения."""

    exam_id: str
    course_id: int
    completed: bool
    pending_question: ExamQuestionPayload | None = None
    results: list[ExamResultPayload]


def _serialize_question(question: ExamQuestion) -> ExamQuestionPayload:
    """Приводит доменную модель вопроса к сериализуемой схеме ответа API."""
    return ExamQuestionPayload(
        id=question.id,
        text=question.text,
        reference_answer=question.reference_answer,
    )


def _serialize_result(result: ExamResult) -> ExamResultPayload:
    """Приводит результат проверки ответа к схеме для выдачи через API."""
    return ExamResultPayload(
        question_id=result.question.id,
        question_text=result.question.text,
        user_answer=result.user_answer,
        verdict=result.verdict,
        recommendation=result.recommendation,
        issues=list(result.issues),
        score=result.score,
        raw_feedback=result.raw_feedback,
    )


@app.post(
    "/api/v1/courses/{course_id}/exam/start",
    response_model=StartExamResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Экзамен"],
)
def start_exam(
    course_id: int = Path(..., ge=1),
    payload: StartExamRequest = Body(...),
) -> StartExamResponse:
    """Создает новый экзамен и возвращает первый вопрос."""
    try:
        session = _exam_agent.create_session(
            course_id=course_id,
            question_count=payload.question_count,
            language=payload.language,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if not session.has_next_question():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось подготовить вопросы для экзамена.",
        )

    first_question = session.next_question()
    exam_id = str(uuid4())
    _get_exam_store()[exam_id] = (course_id, payload.student_id, session)

    return StartExamResponse(
        exam_id=exam_id,
        question=_serialize_question(first_question),
        has_more_questions=session.has_next_question(),
    )


def _get_exam_or_404(course_id: int, exam_id: str) -> tuple[int, ExamSession]:
    """Извлекает экзамен по идентификатору или выбрасывает 404.
    Возвращает (student_id, session).
    """
    record = _get_exam_store().get(exam_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Экзамен с идентификатором {exam_id} не найден.",
        )
    stored_course_id, student_id, session = record
    if stored_course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Для курса #{course_id} экзамен с идентификатором {exam_id} не найден.",
        )
    return student_id, session


@app.post(
    "/api/v1/courses/{course_id}/exam/answer",
    response_model=SubmitAnswerResponse,
    tags=["Экзамен"],
)
def submit_answer(
    course_id: int = Path(..., ge=1),
    payload: SubmitAnswerRequest = Body(...),
) -> SubmitAnswerResponse:
    """Принимает ответ студента, оценивает его и отдает следующий вопрос (если есть)."""
    _student_id, session = _get_exam_or_404(course_id, payload.exam_id)
    try:
        result = session.submit_answer(payload.answer)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Нет активного вопроса для оценки. Запросите следующий вопрос.",
        ) from exc

    next_question: ExamQuestion | None = None
    if session.has_next_question():
        next_question = session.next_question()

    completed = not session.has_next_question() and next_question is None and getattr(
        session, "_active_question", None
    ) is None

    return SubmitAnswerResponse(
        evaluation=_serialize_result(result),
        next_question=_serialize_question(next_question) if next_question else None,
        has_more_questions=session.has_next_question(),
        completed=completed,
    )


@app.get(
    "/api/v1/courses/{course_id}/summary",
    response_model=ExamSummaryResponse,
    tags=["Экзамен"],
)
def get_exam_summary(
    course_id: int = Path(..., ge=1),
    exam_id: str = Query(..., min_length=1),
) -> ExamSummaryResponse:
    """Возвращает состояние экзамена: пройденные вопросы, активный и флаг завершения."""
    student_id, session = _get_exam_or_404(course_id, exam_id)
    pending_question = getattr(session, "_active_question", None)
    completed = not session.has_next_question() and pending_question is None

    # Сохраняем результат в БД при завершении экзамена
    if completed and session.results:
        _save_exam_result(student_id, course_id, session)

    return ExamSummaryResponse(
        exam_id=exam_id,
        course_id=course_id,
        completed=completed,
        pending_question=_serialize_question(pending_question) if pending_question else None,
        results=[_serialize_result(result) for result in session.results],
    )


def _save_exam_result(student_id: int, course_id: int, session: ExamSession) -> None:
    """Сохраняет результат экзамена в БД (вызывается один раз при завершении)."""
    # Проверяем, что ещё не сохраняли (через флаг на сессии)
    if getattr(session, "_saved_to_db", False):
        return
    try:
        answers = []
        scores = []
        for result in session.results:
            score_val = None
            if result.score is not None:
                try:
                    score_val = float(result.score)
                    scores.append(score_val)
                except (ValueError, TypeError):
                    pass
            answers.append({
                "question_id": result.question.id,
                "question_text": result.question.text,
                "user_answer": result.user_answer,
                "verdict": result.verdict,
                "recommendation": result.recommendation,
                "issues": list(result.issues),
                "score": result.score,
            })

        avg_score = sum(scores) / len(scores) if scores else None

        repo = ExamResultRepository()
        repo.save(
            student_id=student_id,
            course_id=course_id,
            total_questions=len(session.results),
            avg_score=avg_score,
            completed=True,
            answers=answers,
        )
        session._saved_to_db = True
    except Exception as e:
        print(f"[EXAM] Ошибка сохранения результата: {e}")
