from loguru import logger
from langchain_core.tools import tool

from rag.queries import query_progress


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
            data = query_progress(student_id, course_id)
            lines = ["Сводка прогресса по курсу:\n"]

            t = data["tests"]
            if t["count"]:
                lines.append(f"**Тесты:** {t['count']} попыток, средний результат: {t['avg_percentage']:.1f}%")
            else:
                lines.append("**Тесты:** нет результатов")

            e = data["exams"]
            if e["count"]:
                score_str = f"{e['avg_score']:.1f}/100" if e["avg_score"] else "нет данных"
                lines.append(f"**Экзамены:** {e['count']} попыток, средний балл: {score_str}")
            else:
                lines.append("**Экзамены:** нет результатов")

            r = data["reports"]
            if r["total"]:
                lines.append(
                    f"**Лабораторные:** {r['total']} отчётов — принято: {r['approved']}, "
                    f"на проверке: {r['pending']}, не принято: {r['not-approved']}"
                )
                status_map = {"approved": "принято", "pending": "на проверке", "not-approved": "не принято"}
                for d in r["details"]:
                    comment = f" | Комментарий: {d['comment']}" if d["comment"] else ""
                    lines.append(f"  - {d['lab_title']} | {status_map.get(d['status'], d['status'])}{comment}")
            else:
                lines.append("**Лабораторные:** отчёты не загружены")

            result = "\n".join(lines)
            logger.debug(f"    ← get_my_progress: тестов={t['count']}, экзаменов={e['count']}, отчётов={r['total']}")
            return result
        except Exception as e:
            logger.error(f"    ← get_my_progress ERROR: {e}")
            return f"Ошибка получения прогресса: {e}"

    return get_my_progress
