from loguru import logger
from langchain_core.tools import tool

from rag.queries import query_exam_results, query_exam_details


def make_exam_tools(student_id: int, course_id: int):
    @tool
    def get_my_exam_results() -> str:
        """
        Возвращает список всех попыток экзаменов студента по текущему курсу.
        Вызывай когда студент спрашивает про свои экзамены, результаты экзамена, оценки.
        Также вызывай первым шагом перед get_exam_details, чтобы узнать доступные ID экзаменов.
        Каждый результат содержит: id, средний балл, завершён ли, дату.
        """
        logger.debug(f"    → get_my_exam_results(student_id={student_id}, course_id={course_id})")
        try:
            results = query_exam_results(student_id, course_id)
            if not results:
                logger.debug("    ← get_my_exam_results: нет результатов")
                return "У студента пока нет результатов экзаменов по этому курсу."
            lines = ["Результаты экзаменов студента:"]
            for r in results:
                score_str = f"{r['avg_score']:.1f}/100" if r["avg_score"] is not None else "не завершён"
                lines.append(
                    f"- ID {r['id']} | Вопросов: {r['total_questions']} | Средний балл: {score_str} "
                    f"| Завершён: {'да' if r['completed'] else 'нет'} | Дата: {r['created_at']}"
                )
            result = "\n".join(lines)
            logger.debug(f"    ← get_my_exam_results: {len(results)} экзаменов")
            return result
        except Exception as e:
            logger.error(f"    ← get_my_exam_results ERROR: {e}")
            return f"Ошибка получения результатов экзаменов: {e}"

    @tool
    def get_exam_details(exam_result_id: int) -> str:
        """
        Возвращает детали конкретного экзамена по его ID.
        Вызывай когда студент хочет разобрать экзамен. Если ID уже известен из контекста
        или экзамен только один — вызывай сразу без лишних уточнений.
        Возвращает каждый вопрос с ответом студента, вердиктом и рекомендациями.
        """
        logger.debug(f"    → get_exam_details(exam_result_id={exam_result_id})")
        try:
            details = query_exam_details(exam_result_id)
            if not details:
                logger.debug("    ← get_exam_details: не найдено")
                return f"Детали экзамена ID {exam_result_id} не найдены."
            lines = [f"Детали экзамена ID {exam_result_id}:"]
            for d in details:
                lines.append(
                    f"\nВопрос {d['question_id']}: {d['question_text']}\n"
                    f"  Ответ: {d['user_answer']}\n"
                    f"  Вердикт: {d['verdict']} | Балл: {d['score']}/100\n"
                    f"  Рекомендация: {d['recommendation']}"
                )
            result = "\n".join(lines)
            logger.debug(f"    ← get_exam_details: {len(details)} вопросов")
            return result
        except Exception as e:
            logger.error(f"    ← get_exam_details ERROR: {e}")
            return f"Ошибка получения деталей экзамена: {e}"

    return get_my_exam_results, get_exam_details
