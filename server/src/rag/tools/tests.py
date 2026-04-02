import json

from loguru import logger
from langchain_core.tools import tool

from database.sql.repositories.test_results import TestResultRepository


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
            rows = TestResultRepository().get_by_student_and_course(student_id, course_id)
            if not rows:
                logger.debug("    ← get_my_test_results: нет результатов")
                return "У студента пока нет результатов тестов по этому курсу."
            lines = ["Результаты тестов студента:"]
            for row in rows:
                test_id, topic, source, difficulty, total, correct, wrong, pct, created_at = row
                lines.append(
                    f"- ID {test_id} | Тема: {topic or 'не указана'} | Сложность: {difficulty} "
                    f"| Правильных: {correct}/{total} ({pct:.1f}%) | Дата: {created_at}"
                )
            result = "\n".join(lines)
            logger.debug(f"    ← get_my_test_results: {len(rows)} тестов")
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
            rows = TestResultRepository().get_answers(test_result_id)
            mistakes = [row for row in rows if not row[5]]  # is_correct == False
            if not mistakes:
                logger.debug(f"    ← get_test_mistakes: ошибок нет")
                return f"В тесте ID {test_result_id} нет ошибок — все ответы правильные!"
            lines = [f"Ошибки в тесте ID {test_result_id}:"]
            for row in mistakes:
                q_num, q_text, options, user_ans, correct_ans, _ = row
                if isinstance(options, str):
                    options = json.loads(options)
                user_text = options.get(user_ans, user_ans) if options else user_ans
                correct_text = options.get(correct_ans, correct_ans) if options else correct_ans
                lines.append(
                    f"\nВопрос {q_num}: {q_text}\n"
                    f"  Твой ответ: **{user_ans}** — {user_text}\n"
                    f"  Правильный ответ: **{correct_ans}** — {correct_text}"
                )
            result = "\n".join(lines)
            logger.debug(f"    ← get_test_mistakes: {len(mistakes)} ошибок из {len(rows)} вопросов")
            return result
        except Exception as e:
            logger.error(f"    ← get_test_mistakes ERROR: {e}")
            return f"Ошибка получения ошибок теста: {e}"

    return get_my_test_results, get_test_mistakes
