from database.sql import StudentRepository
from settings import PersonalizationModuleSettings

from .llm import llm


settings = PersonalizationModuleSettings()


class Personalizer:
    def personalize_message_for_student(self, message: str, student_id: int) -> str:
        student_repository = StudentRepository()

        student_characteristic = student_repository.get_characteristic(student_id)
        personalized_message = self.__get_personalized_message(message, student_characteristic)

        return personalized_message

    def configure_student_characteristic(self, student_id: int, student_message: int) -> None:
        student_repository = StudentRepository()

        old_student_characteristic = student_repository.get_characteristic(student_id)
        new_student_characteristic = self.__get_new_characteristic(old_student_characteristic, student_message)

        student_repository.update_characteristic(student_id, new_student_characteristic)

    def __get_personalized_message(self, message: str, student_characteristic: str) -> str:
        formatted_prompt = settings.apply_personalization_prompt.format(
            text=message,
            student_characteristic=student_characteristic
        )
        personalized_message = llm.invoke(formatted_prompt)
        return personalized_message

    def __get_new_characteristic(self, old_student_characteristic: str, student_message: str) -> str:
        formatted_prompt = settings.update_personalization_prompt.format(
            student_characteristic=old_student_characteristic,
            student_message=student_message
        )
        new_student_characteristic = llm.invoke(formatted_prompt)
        return new_student_characteristic
