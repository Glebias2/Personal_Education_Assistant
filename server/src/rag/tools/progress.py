from loguru import logger
from langchain_core.tools import tool

from database.sql.repositories.test_results import TestResultRepository
from database.sql.repositories.exam_results import ExamResultRepository
from database.sql.repositories.reports import ReportRepository


def make_progress_tool(student_id: int, course_id: int):
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

    return get_my_progress
