import logging
from typing import Tuple, Optional

from database.sql import CourseRepository
from database.vector.repositories import StorageManager

logger = logging.getLogger(__name__)


class MaterialProvider:
    """Провайдер материала — ищет в векторной БД курса по теме."""

    def get_validated_material(
        self, topic: str, course_id: Optional[int] = None
    ) -> Tuple[bool, Optional[str], str]:
        """Получить материал по теме из векторного хранилища курса.

        Args:
            topic: тема для поиска
            course_id: ID курса (если None — ошибка)

        Returns:
            (success, material_text, message)
        """
        if not topic or not topic.strip():
            return (False, None, "Тема не может быть пустой")

        if not course_id:
            return (False, None, "Не указан курс для поиска материалов")

        # Получаем storage_id курса
        course_repository = CourseRepository()
        storage_id = course_repository.get_storage_id(course_id)

        if not storage_id:
            return (False, None, "У курса нет загруженных материалов")

        # Ищем в векторном хранилище
        try:
            vector_storage = StorageManager.get_vector_storage(storage_id)
        except ValueError:
            return (False, None, "Векторное хранилище курса не найдено")

        try:
            docs = vector_storage.hybrid_search(topic.strip(), k=10, alpha=0.75)
        except Exception as e:
            logger.warning(f"Hybrid search failed ({e}), fallback to similarity_search")
            docs = vector_storage.similarity_search(topic.strip(), k=10)

        if not docs:
            return (False, None, f"По теме '{topic}' материалы не найдены")

        # Собираем текст из найденных чанков
        material = "\n\n".join(doc.page_content for doc in docs)

        if len(material.strip()) < 50:
            return (False, None, f"Недостаточно материала по теме '{topic}'")

        logger.info(
            f"Найден материал по теме '{topic}': {len(docs)} чанков, {len(material)} символов"
        )

        return (True, material, f"Материал по теме '{topic}' получен из курса")
