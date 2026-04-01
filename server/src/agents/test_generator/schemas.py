# test_generator/schemas.py
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from .models import Question, EvaluationResult

# Запрос на генерацию теста по теме
class GenerateByTopicRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    course_id: int = Field(..., description="ID курса для поиска материалов")
    num_questions: int = Field(default=3, ge=1, le=20)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")

# Запрос на генерацию теста из файла"""
class GenerateByFileRequest(BaseModel):
    num_questions: int = Field(default=3, ge=1, le=20)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")

# Отправка ответов на проверку
class SubmitAnswersRequest(BaseModel):
    answers: List[str] = Field(..., description="[A, B, C, ...] ответы в порядке вопросов")
    student_id: int = Field(..., description="ID студента")
    course_id: int = Field(..., description="ID курса")


# Вопрос в ответе API
class QuestionResponse(BaseModel):
    question_num: int
    text: str
    options: Dict[str, str]
    type: str

# Ответ при успешной генерации теста
class TestsResponse(BaseModel):
    success: bool
    total_questions: int
    difficulty: str
    questions: List[QuestionResponse] = []
    error: Optional[str] = None

# Ответ при проверке ответов
class EvaluationResponseAPI(BaseModel):
    success: bool
    total_questions: int = 0
    correct_answers: int = 0
    wrong_answers: int = 0
    percentage: float = 0.0
    error: Optional[str] = None


# Статус текущей сессии
class StatusResponse(BaseModel):
    material_loaded: bool
    material_length: int
    test_generated: bool
    total_questions: int
    difficulty: Optional[str]

# Ответ при сбросе сессии
class ResetResponse(BaseModel):
    success: bool
    message: str

# Статус API
class HealthResponse(BaseModel):
    status: str
    message: str
