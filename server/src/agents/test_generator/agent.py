from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from .models import Question, TestGenerationResponse
from .parser import TestParser
from .prompts import TestGenerationPrompts
from .config import Config


class TestGenerationAgent:
    def __init__(self):
        self.parser = TestParser(debug=False)

    def _get_llm(self, temperature: float = 0.5) -> ChatGoogleGenerativeAI:
        return ChatGoogleGenerativeAI(
            model=Config.MODEL_NAME,
            google_api_key=Config.API_KEY,
            temperature=temperature,
            max_output_tokens=Config.MAX_TOKENS,
        )

    def _call_llm(self, prompt: str, temperature: float = 0.5) -> Optional[str]:
        try:
            llm = self._get_llm(temperature)
            response = llm.invoke(prompt)
            return response.content.strip()
        except Exception as e:
            print(f"Ошибка LLM: {e}")
            return None

    def validate_topic(self, topic: str) -> bool:
        try:
            prompt = TestGenerationPrompts.get_topic_validation_prompt(topic)
            answer = self._call_llm(prompt, temperature=0.1)
            if not answer:
                return False
            return "YES" in answer.upper()
        except Exception as e:
            print(f"Ошибка валидации темы: {e}")
            return False

    def validate_topic_in_material(self, topic: str, material: str) -> bool:
        try:
            topic_lower = topic.lower()
            material_lower = material.lower()

            topic_words = topic_lower.split()
            stop_words = {'в', 'на', 'из', 'и', 'или', 'к', 'с', 'по', 'от', 'для', 'а',
                          'the', 'of', 'and', 'or', 'is', 'are', 'at', 'to', 'be', 'this', 'that'}
            important_words = [w for w in topic_words if len(w) > 2 and w not in stop_words]

            if not important_words:
                return True

            found_words = sum(1 for word in important_words if word in material_lower)
            return found_words >= max(1, len(important_words) // 2)
        except Exception as e:
            print(f"Ошибка проверки темы в материале: {e}")
            return False

    def generate_from_topic(self, topic: str, num_questions: int = 4, difficulty: str = "medium") -> TestGenerationResponse:
        if not self.validate_topic(topic):
            return TestGenerationResponse(
                success=False,
                questions=None,
                error=f"Тема '{topic}' не найдена или не существует."
            )

        material = self._generate_material_from_topic(topic)
        if not material:
            return TestGenerationResponse(
                success=False,
                questions=None,
                error=f"Не удалось сгенерировать материал по теме '{topic}'"
            )

        if not self.validate_topic_in_material(topic, material):
            return TestGenerationResponse(
                success=False,
                questions=None,
                error=f"Сгенерированный материал не соответствует теме '{topic}'."
            )

        return self._generate_questions(material, num_questions, difficulty, topic)

    def generate_from_file(self, material: str, num_questions: int = 4, difficulty: str = "medium") -> TestGenerationResponse:
        return self._generate_questions(material, num_questions, difficulty, topic="Из загруженного материала")

    def _generate_material_from_topic(self, topic: str) -> Optional[str]:
        prompt = f"""Ты опытный преподаватель. Создай краткий но информативный учебный материал (200-300 слов) по теме: {topic}

Материал должен быть:
- Четким и структурированным
- Содержать ключевые факты и концепции
- Подходить для создания тестовых вопросов
- На русском языке
- ОБЯЗАТЕЛЬНО содержать основные термины и концепции из темы "{topic}"

Напиши только материал, без дополнительных комментариев."""

        return self._call_llm(prompt, temperature=0.5)

    def _generate_questions(self, material: str, num_questions: int, difficulty: str,
                            topic: str) -> TestGenerationResponse:
        try:
            prompt = TestGenerationPrompts.get_prompt_with_topic(difficulty, material, num_questions, topic)

            temperature = {
                'easy': Config.TEMPERATURE_EASY,
                'medium': Config.TEMPERATURE_MEDIUM,
                'hard': Config.TEMPERATURE_HARD
            }.get(difficulty, Config.TEMPERATURE_MEDIUM)

            llm_output = self._call_llm(prompt, temperature)
            if not llm_output:
                return TestGenerationResponse(
                    success=False,
                    questions=None,
                    error="LLM не вернула ответ"
                )

            questions, errors = self.parser.parse_questions(llm_output)

            if not questions:
                return TestGenerationResponse(
                    success=False,
                    questions=None,
                    error=f"Не удалось создать вопросы. Ошибки: {', '.join(errors)}"
                )

            return TestGenerationResponse(
                success=True,
                questions=questions,
                error=None
            )

        except Exception as e:
            print(f"Ошибка генерации вопросов: {e}")
            return TestGenerationResponse(
                success=False,
                questions=None,
                error=str(e)
            )
