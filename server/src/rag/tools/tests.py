from loguru import logger
from langchain_core.tools import tool

from rag.queries import query_test_results, query_test_mistakes


def make_test_tools(student_id: int, course_id: int):
    @tool
    def get_my_test_results() -> str:
        """
        Возвращает список всех попыток тестов студента по текущему курсу.
        Вызывай когда студент спрашивает про свои тесты, прогресс, результаты, последний тест.
        Также вызывай первым шагом перед get_test_mistakes, чтобы узнать доступные ID тестов.
        Каждый результат содержит: id, тему, сложность, % правильных ответов, дату.
        """
        logger.debug(f"    → get_my_test_results(student_id={student_id}, course_id={course_id})")
        try:
            results = query_test_results(student_id, course_id)
            if not results:
                logger.debug("    ← get_my_test_results: нет результатов")
                return "У студента пока нет результатов тестов по этому курсу."
            lines = ["Результаты тестов студента:"]
            for r in results:
                lines.append(
                    f"- ID {r['id']} | Тема: {r['topic'] or 'не указана'} | Сложность: {r['difficulty']} "
                    f"| Правильных: {r['correct_answers']}/{r['total_questions']} ({r['percentage']:.1f}%) | Дата: {r['created_at']}"
                )
            result = "\n".join(lines)
            logger.debug(f"    ← get_my_test_results: {len(results)} тестов")
            return result
        except Exception as e:
            logger.error(f"    ← get_my_test_results ERROR: {e}")
            return f"Ошибка получения результатов тестов: {e}"

    @tool
    def get_test_mistakes(test_result_id: int) -> str:
        """
        Возвращает ошибки студента в конкретном тесте по его ID.
        Вызывай когда студент хочет разобрать ошибки теста. Если ID теста уже известен из контекста
        или тест только один — вызывай сразу, не спрашивай подтверждения. Если тестов несколько
        и студент не уточнил какой — сначала покажи список через get_my_test_results и попроси уточнить.
        Возвращает только неправильные ответы: вопрос, полный текст ответа студента и правильного ответа.
        """
        logger.debug(f"    → get_test_mistakes(test_result_id={test_result_id})")
        try:
            mistakes = query_test_mistakes(test_result_id)
            if not mistakes:
                logger.debug("    ← get_test_mistakes: ошибок нет")
                return f"В тесте ID {test_result_id} нет ошибок — все ответы правильные!"
            lines = [f"Ошибки в тесте ID {test_result_id}:"]
            for m in mistakes:
                options = m["options"]  # уже dict после queries.py
                user_text = options.get(m["user_answer"], m["user_answer"]) if options else m["user_answer"]
                correct_text = options.get(m["correct_answer"], m["correct_answer"]) if options else m["correct_answer"]
                lines.append(
                    f"\nВопрос {m['question_num']}: {m['question_text']}\n"
                    f"  Твой ответ: **{m['user_answer']}** — {user_text}\n"
                    f"  Правильный ответ: **{m['correct_answer']}** — {correct_text}"
                )
            result = "\n".join(lines)
            logger.debug(f"    ← get_test_mistakes: {len(mistakes)} ошибок")
            return result
        except Exception as e:
            logger.error(f"    ← get_test_mistakes ERROR: {e}")
            return f"Ошибка получения ошибок теста: {e}"

    return get_my_test_results, get_test_mistakes
