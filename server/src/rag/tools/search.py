from loguru import logger
from langchain_core.tools import tool

from database.vector.repositories.storage import StorageManager


def make_search_tool(storage_id: str):
    @tool
    def search_course_materials(query: str) -> str:
        """
        Гибридный поиск по материалам курса (BM25 + vector).
        Вызывай для любого учебного вопроса: объяснить тему, дать определение, найти правильный ответ,
        разобрать понятие из курса. Не отвечай на учебные вопросы по памяти — всегда ищи через этот инструмент.
        Возвращает релевантные фрагменты из загруженных материалов курса.
        """
        logger.debug(f"    → search_course_materials(query='{query[:80]}')")
        try:
            vector_storage = StorageManager.get_vector_storage(storage_id)
            docs = vector_storage.hybrid_search(query, k=8, alpha=0.75)
            if not docs:
                logger.debug("    ← search_course_materials: ничего не найдено")
                return "По запросу ничего не найдено в материалах курса."
            result = "\n\n---\n\n".join(doc.page_content for doc in docs)
            logger.debug(f"    ← search_course_materials: {len(docs)} чанков, {len(result)} символов")
            return result
        except Exception as e:
            logger.error(f"    ← search_course_materials ERROR: {e}")
            return f"Ошибка поиска по материалам: {e}"

    return search_course_materials
