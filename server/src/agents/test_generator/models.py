from typing import Dict, List, Optional
from pydantic import BaseModel, Field

# Вариант ответа
class QuestionOption(BaseModel):
    letter: str = Field(..., description="A, B, C, D")
    text: str = Field(..., description="Текст варианта ответа")

# Вопрос теста
class Question(BaseModel):
    question_num: int = Field(..., description="Номер вопроса")
    text: str = Field(..., description="Текст вопроса")
    options: Dict[str, str] = Field(..., description="Варианты ответов {A: текст, B: текст...}")
    correct_answer: str = Field(..., description="A, B, C, D")
    type: str = Field(default="multiple_choice", description="Тип вопроса")

# Результат ответа на один вопрос
class EvaluationResult(BaseModel):
    question_num: int
    question_text: str
    options: Dict[str, str]
    user_answer: str
    correct_answer: str
    is_correct: bool

# Ответ от LLM для генерации тестов
class TestGenerationResponse(BaseModel):
    success: bool
    questions: Optional[List[Question]] = None
    error: Optional[str] = None


# Полный результат проверки теста
class EvaluationResponse(BaseModel):
    success: bool
    total_questions: Optional[int] = None
    correct_answers: Optional[int] = None
    wrong_answers: Optional[int] = None
    percentage: Optional[float] = None
    grade: Optional[int] = None  # 0-10
    grade_description: Optional[str] = None
    results: Optional[List[EvaluationResult]] = None
    error: Optional[str] = None
