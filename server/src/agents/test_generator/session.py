# test_generator/session.py
from typing import Optional, List
from .models import Question

# Усправление состоянием текущей сессии пользователя
class SessionManager:
    def __init__(self):
        self._reset()

    # Сброс внутреннего состояния
    def _reset(self):
        self.material: Optional[str] = None
        self.questions: Optional[List[Question]] = None
        self.difficulty: Optional[str] = None
        self.num_questions: Optional[int] = None
        self.test_generated: bool = False

    # Установить материал для генерации
    def set_material(self, material: str) -> None:
        if not material or not material.strip():
            raise ValueError("Материал не может быть пустым")

        self.material = material
        # При загрузке нового материала сбрасываем старый тест
        self.questions = None
        self.test_generated = False

    # Получаем текущий материал
    def get_material(self) -> Optional[str]:
        return self.material

    # Проверка на то, что материал загружен
    def has_material(self) -> bool:
        return self.material is not None

    # Длина материала
    def get_material_length(self) -> int:
        return len(self.material) if self.material else 0

    # Установить сгенерированный тест
    def set_test(self, questions: List[Question], difficulty: str, num_questions: int) -> None:
        if not questions:
            raise ValueError("Вопросы не могут быть пустыми")

        self.questions = questions
        self.difficulty = difficulty
        self.num_questions = num_questions
        self.test_generated = True

    # Получить вопросы текущего теста
    def get_questions(self) -> Optional[List[Question]]:
        return self.questions

    # Проверить что тест сгенерирован
    def is_test_generated(self) -> bool:
        return self.test_generated

    # Получить информацию о тесте
    def get_test_info(self) -> dict:
        return {
            "difficulty": self.difficulty,
            "num_questions": self.num_questions,
            "test_generated": self.test_generated
        }

    # Получить полный статус сессии
    def get_status(self) -> dict:
        return {
            "material_loaded": self.has_material(),
            "material_length": self.get_material_length(),
            "test_generated": self.test_generated,
            "total_questions": self.num_questions or 0,
            "difficulty": self.difficulty
        }

    # Сброс сессии
    def reset(self) -> None:
        self._reset()
