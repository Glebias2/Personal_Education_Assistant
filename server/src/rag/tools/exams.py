from loguru import logger
from langchain_core.tools import tool

from database.sql.repositories.exam_results import ExamResultRepository


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
            rows = ExamResultRepository().get_by_student_and_course(student_id, course_id)
            if not rows:
                logger.debug("    ← get_my_exam_results: нет результатов")
                return "У студента пока нет результатов экзаменов по этому курсу."
            lines = ["Результаты экзаменов студента:"]
            for row in rows:
                exam_id, total_q, avg_score, completed, created_at = row
                score_str = f"{avg_score:.1f}/100" if avg_score is not None else "не завершён"
                lines.append(
                    f"- ID {exam_id} | Вопросов: {total_q} | Средний балл: {score_str} "
                    f"| Завершён: {'да' if completed else 'нет'} | Дата: {created_at}"
                )
            result = "\n".join(lines)
            logger.debug(f"    ← get_my_exam_results: {len(rows)} экзаменов")
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
            rows = ExamResultRepository().get_answers(exam_result_id)
            if not rows:
                logger.debug(f"    ← get_exam_details: не найдено")
                return f"Детали экзамена ID {exam_result_id} не найдены."
            lines = [f"Детали экзамена ID {exam_result_id}:"]
            for row in rows:
                q_id, q_text, user_ans, verdict, recommendation, issues, score = row
                lines.append(
                    f"\nВопрос {q_id}: {q_text}\n"
                    f"  Ответ: {user_ans}\n"
                    f"  Вердикт: {verdict} | Балл: {score}/100\n"
                    f"  Рекомендация: {recommendation}"
                )
            result = "\n".join(lines)
            logger.debug(f"    ← get_exam_details: {len(rows)} вопросов")
            return result
        except Exception as e:
            logger.error(f"    ← get_exam_details ERROR: {e}")
            return f"Ошибка получения деталей экзамена: {e}"

    return get_my_exam_results, get_exam_details
