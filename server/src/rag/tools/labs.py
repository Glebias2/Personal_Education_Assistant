from loguru import logger
from langchain_core.tools import tool

from rag.queries import query_course_labs


def make_labs_tool(course_id: int):
    @tool
    def get_course_labs() -> str:
        """
        Возвращает список лабораторных работ курса с номерами, названиями и описанием заданий.
        Вызывай первым шагом скилла «Помощь с лабораторной работой», чтобы узнать какие лабы есть,
        и использовать название + задание лабы как запрос в search_course_materials.
        Также вызывай если студент упоминает лабу по номеру или названию — чтобы узнать её задание.
        """
        logger.debug(f"    → get_course_labs(course_id={course_id})")
        try:
            labs = query_course_labs(course_id)
            if not labs:
                logger.debug("    ← get_course_labs: лаб нет")
                return "Лабораторные работы не добавлены в этот курс."
            lines = ["Лабораторные работы курса:"]
            for lab in labs:
                task_text = (lab["task"][:300] + "...") if lab["task"] and len(lab["task"]) > 300 else (lab["task"] or "Задание не указано")
                lines.append(f"\n**Лаба {lab['number']}: {lab['title']}** (ID: {lab['id']})\nЗадание: {task_text}")
            result = "\n".join(lines)
            logger.debug(f"    ← get_course_labs: {len(labs)} лаб")
            return result
        except Exception as e:
            logger.error(f"    ← get_course_labs ERROR: {e}")
            return f"Ошибка получения лаб: {e}"

    return get_course_labs
