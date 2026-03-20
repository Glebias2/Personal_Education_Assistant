from typing import Optional
from .models import Question, EvaluationResponse, TestGenerationResponse
from .session import SessionManager
from .agent import TestGenerationAgent
from .evaluator import TestEvaluator
from .processor import MaterialProcessor
from .material_provider import MaterialProvider
from .schemas import (GenerateByTopicRequest, GenerateByFileRequest, SubmitAnswersRequest, TestsResponse,
                      QuestionResponse, EvaluationResponseAPI)

# Бизнес-логика системы
class TestService:
    def __init__(self):
        self.session = SessionManager()
        self.agent = TestGenerationAgent()
        self.evaluator = TestEvaluator()
        self.processor = MaterialProcessor()
        self.material_provider = MaterialProvider()

    # Загрузка материала
    def upload_material(self, material: str) -> dict:
        if not material or not material.strip():
            return {
                "success": False,
                "error": "Материал не может быть пустым"
            }

        try:
            self.session.set_material(material)
            return {
                "success": True,
                "message": f"Материал загружен: {len(material)} символов",
                "material_length": len(material)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    # Генерация теста по теме
    def generate_by_topic(self, request: GenerateByTopicRequest) -> TestsResponse:
        # Валидация
        if not request.topic or not request.topic.strip():
            return TestsResponse(
                success=False,
                total_questions=0,
                difficulty=request.difficulty,
                error="Тема не может быть пустой"
            )

        if not (1 <= request.num_questions <= 20):
            return TestsResponse(
                success=False,
                total_questions=0,
                difficulty=request.difficulty,
                error="Количество вопросов должно быть от 1 до 20"
            )

        # Получаем материал из векторной БД курса
        success, material, message = self.material_provider.get_validated_material(
            request.topic, course_id=request.course_id
        )

        if not success:
            return TestsResponse(
                success=False,
                total_questions=0,
                difficulty=request.difficulty,
                error=message
            )

        # Подготавливаем материал для LLM
        processed_material = self.processor.prepare_for_llm(material)

        # Генерируем вопросы из материала
        gen_response: TestGenerationResponse = self.agent.generate_from_file(
            material=processed_material,
            num_questions=request.num_questions,
            difficulty=request.difficulty
        )

        if not gen_response.success:
            return TestsResponse(
                success=False,
                total_questions=0,
                difficulty=request.difficulty,
                error=gen_response.error
            )

        # Сохраняем в сессию
        self.session.set_test(
            questions=gen_response.questions,
            difficulty=request.difficulty,
            num_questions=request.num_questions
        )

        questions_response = [
            QuestionResponse(
                question_num=q.question_num,
                text=q.text,
                options=q.options,
                type=q.type
            )
            for q in gen_response.questions
        ]

        return TestsResponse(
            success=True,
            total_questions=len(gen_response.questions),
            difficulty=request.difficulty,
            questions=questions_response
        )

    # Генерировать тест из загруженного файла
    def generate_by_file(self, request: GenerateByFileRequest) -> TestsResponse:

        # Проверяем что материал загружен
        if not self.session.has_material():
            return TestsResponse(
                success=False,
                total_questions=0,
                difficulty=request.difficulty,
                error="Сначала загрузите файл материала"
            )

        # Валидация
        if not (1 <= request.num_questions <= 20):
            return TestsResponse(
                success=False,
                total_questions=0,
                difficulty=request.difficulty,
                error="Количество вопросов должно быть от 1 до 20"
            )

        # Подготавливаем материал
        material = self.session.get_material()
        processed_material = self.processor.prepare_for_llm(material)

        # Генерируем
        gen_response: TestGenerationResponse = self.agent.generate_from_file(
            material=processed_material,
            num_questions=request.num_questions,
            difficulty=request.difficulty
        )

        if not gen_response.success:
            return TestsResponse(
                success=False,
                total_questions=0,
                difficulty=request.difficulty,
                error=gen_response.error
            )

        # Сохраняем в сессию
        self.session.set_test(
            questions=gen_response.questions,
            difficulty=request.difficulty,
            num_questions=request.num_questions
        )

        # Преобразуем в API ответ
        questions_response = [
            QuestionResponse(
                question_num=q.question_num,
                text=q.text,
                options=q.options,
                type=q.type
            )
            for q in gen_response.questions
        ]

        return TestsResponse(
            success=True,
            total_questions=len(gen_response.questions),
            difficulty=request.difficulty,
            questions=questions_response
        )

    # Проверить ответы на тест
    def submit_answers(self, request: SubmitAnswersRequest) -> EvaluationResponseAPI:

        # Проверяем что тест сгенерирован
        if not self.session.is_test_generated():
            return EvaluationResponseAPI(
                success=False,
                error="Сначала сгенерируйте тест"
            )

        questions = self.session.get_questions()

        # Проверяем количество ответов
        if len(request.answers) != len(questions):
            return EvaluationResponseAPI(
                success=False,
                error=f"Ожидается {len(questions)} ответов, получено {len(request.answers)}"
            )

        # Вычисляем результаты
        eval_response: EvaluationResponse = self.evaluator.evaluate_answers(
            questions=questions,
            user_answers=request.answers
        )

        if not eval_response.success:
            return EvaluationResponseAPI(
                success=False,
                error=eval_response.error
            )

        # Преобразуем в API ответ
        return EvaluationResponseAPI(
            success=True,
            total_questions=eval_response.total_questions,
            correct_answers=eval_response.correct_answers,
            wrong_answers=eval_response.wrong_answers,
            percentage=eval_response.percentage
        )

    # Получить статус текущей сессии
    def get_status(self) -> dict:
        return self.session.get_status()

    # Сбросить сессию
    def reset_session(self) -> dict:
        self.session.reset()
        return {
            "success": True,
            "message": "Сессия сброшена"
        }
