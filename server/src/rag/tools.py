"""
LangChain tools для агентного AI-чата.

Функция make_agent_tools(student_id, course_id, storage_id) возвращает список
инструментов с замкнутым контекстом студента — агент не передаёт id явно,
они уже вшиты в функции через closure.
"""
import json

from loguru import logger
from langchain_core.tools import tool

from database.sql.repositories.test_results import TestResultRepository
from database.sql.repositories.exam_results import ExamResultRepository
from database.sql.repositories.reports import ReportRepository
from database.sql.repositories.labs import LabRepository
from database.vector.repositories.storage import StorageManager


def make_agent_tools(student_id: int, course_id: int, storage_id: str) -> list:
    """
    Создаёт список LangChain tools с привязанным контекстом студента.
    Используется в create_react_agent для агентного AI-чата.
    """

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

    @tool
    def get_my_progress() -> str:
        """
        Возвращает общую сводку прогресса студента по текущему курсу:
        количество и средний результат тестов, количество и средний балл экзаменов,
        статусы лабораторных отчётов (принято, на проверке, не принято).
        Вызывай когда студент спрашивает про свой прогресс, успеваемость, общую картину по курсу.
        """
        logger.debug(f"    → get_my_progress(student_id={student_id}, course_id={course_id})")
        try:
            lines = ["Сводка прогресса по курсу:\n"]

            test_rows = TestResultRepository().get_by_student_and_course(student_id, course_id)
            if test_rows:
                avg_pct = sum(row[7] for row in test_rows) / len(test_rows)
                lines.append(f"**Тесты:** {len(test_rows)} попыток, средний результат: {avg_pct:.1f}%")
            else:
                lines.append("**Тесты:** нет результатов")

            exam_rows = ExamResultRepository().get_by_student_and_course(student_id, course_id)
            if exam_rows:
                completed = [row for row in exam_rows if row[3]]
                scores = [row[2] for row in exam_rows if row[2] is not None]
                avg_score = sum(scores) / len(scores) if scores else 0
                lines.append(f"**Экзамены:** {len(exam_rows)} попыток ({len(completed)} завершено), средний балл: {avg_score:.1f}/100")
            else:
                lines.append("**Экзамены:** нет результатов")

            report_rows = ReportRepository().get_by_student_and_course(student_id, course_id)
            if report_rows:
                approved = sum(1 for r in report_rows if r[4] == 'approved')
                pending = sum(1 for r in report_rows if r[4] == 'pending')
                not_approved = sum(1 for r in report_rows if r[4] == 'not-approved')
                lines.append(f"**Лабораторные:** {len(report_rows)} отчётов — принято: {approved}, на проверке: {pending}, не принято: {not_approved}")
                for r in report_rows:
                    status_map = {"approved": "принято", "pending": "на проверке", "not-approved": "не принято"}
                    lines.append(f"  - {r[2]} | {status_map.get(r[4], r[4])}" + (f" | Комментарий: {r[5]}" if r[5] else ""))
            else:
                lines.append("**Лабораторные:** отчёты не загружены")

            result = "\n".join(lines)
            logger.debug(f"    ← get_my_progress: тестов={len(test_rows or [])}, экзаменов={len(exam_rows or [])}, отчётов={len(report_rows or [])}")
            return result
        except Exception as e:
            logger.error(f"    ← get_my_progress ERROR: {e}")
            return f"Ошибка получения прогресса: {e}"

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
            rows = LabRepository().get_labs(course_id)
            if not rows:
                logger.debug("    ← get_course_labs: лаб нет")
                return "Лабораторные работы не добавлены в этот курс."
            lines = ["Лабораторные работы курса:"]
            for lab_id, number, title, task in rows:
                task_text = (task[:300] + "...") if task and len(task) > 300 else (task or "Задание не указано")
                lines.append(f"\n**Лаба {number}: {title}** (ID: {lab_id})\nЗадание: {task_text}")
            result = "\n".join(lines)
            logger.debug(f"    ← get_course_labs: {len(rows)} лаб")
            return result
        except Exception as e:
            logger.error(f"    ← get_course_labs ERROR: {e}")
            return f"Ошибка получения лаб: {e}"

    return [
        search_course_materials,
        get_my_test_results,
        get_test_mistakes,
        get_my_exam_results,
        get_exam_details,
        get_my_progress,
        get_course_labs,
    ]
