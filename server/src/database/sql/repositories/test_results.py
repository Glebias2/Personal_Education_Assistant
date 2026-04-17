import json
from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection


class TestResultRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def save(
        self,
        *,
        student_id: int,
        course_id: int,
        topic: str | None,
        source: str,
        difficulty: str,
        total_questions: int,
        correct_answers: int,
        wrong_answers: int,
        percentage: float,
        answers: list[dict],
        curs: cursor = None,
    ) -> int:
        """Сохраняет результат теста и детали ответов. Возвращает id результата."""
        query = """
            INSERT INTO test_results
                (student_id, course_id, topic, source, difficulty,
                 total_questions, correct_answers, wrong_answers, percentage)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        curs.execute(query, (
            student_id, course_id, topic, source, difficulty,
            total_questions, correct_answers, wrong_answers, percentage,
        ))
        result_id = curs.fetchone()[0]

        for ans in answers:
            detail_query = """
                INSERT INTO test_result_answers
                    (test_result_id, question_num, question_text, options,
                     user_answer, correct_answer, is_correct)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            curs.execute(detail_query, (
                result_id,
                ans["question_num"],
                ans["question_text"],
                json.dumps(ans["options"], ensure_ascii=False),
                ans["user_answer"],
                ans["correct_answer"],
                ans["is_correct"],
            ))

        return result_id

    @postgre_connection(__config)
    def get_by_student(self, student_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT id, course_id, topic, source, difficulty,
                   total_questions, correct_answers, wrong_answers,
                   percentage, created_at::text
            FROM test_results
            WHERE student_id = %s
            ORDER BY created_at DESC
        """
        curs.execute(query, (student_id,))
        return curs.fetchall()

    @postgre_connection(__config)
    def get_by_student_and_course(self, student_id: int, course_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT id, topic, source, difficulty,
                   total_questions, correct_answers, wrong_answers,
                   percentage, created_at::text
            FROM test_results
            WHERE student_id = %s AND course_id = %s
            ORDER BY created_at DESC
        """
        curs.execute(query, (student_id, course_id))
        return curs.fetchall()

    @postgre_connection(__config)
    def get_course_analytics(self, course_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT tr.student_id, s.first_name, s.last_name,
                   COUNT(*) AS test_count,
                   AVG(tr.percentage) AS avg_percentage
            FROM test_results tr
            JOIN students s ON s.id = tr.student_id
            WHERE tr.course_id = %s
            GROUP BY tr.student_id, s.first_name, s.last_name
            ORDER BY avg_percentage DESC
        """
        curs.execute(query, (course_id,))
        return curs.fetchall()

    @postgre_connection(__config)
    def get_course_timeline(self, course_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT tr.student_id, s.first_name, s.last_name,
                   tr.percentage, tr.topic, tr.created_at::text
            FROM test_results tr
            JOIN students s ON s.id = tr.student_id
            WHERE tr.course_id = %s
            ORDER BY tr.created_at ASC
        """
        curs.execute(query, (course_id,))
        return curs.fetchall()

    @postgre_connection(__config)
    def get_topic_accuracy(self, course_id: int, curs: cursor = None) -> list[tuple]:
        """Точность по темам: (topic, total_q, correct_q, accuracy_pct, test_count)."""
        query = """
            SELECT tr.topic,
                   COUNT(tra.id)                                                    AS total_q,
                   SUM(CASE WHEN tra.is_correct THEN 1 ELSE 0 END)                 AS correct_q,
                   ROUND(100.0 * SUM(CASE WHEN tra.is_correct THEN 1 ELSE 0 END)
                         / NULLIF(COUNT(tra.id), 0), 1)                             AS accuracy_pct,
                   COUNT(DISTINCT tr.id)                                            AS test_count
            FROM test_results tr
            JOIN test_result_answers tra ON tra.test_result_id = tr.id
            WHERE tr.course_id = %(cid)s AND tr.topic IS NOT NULL
            GROUP BY tr.topic
            ORDER BY accuracy_pct ASC
        """
        curs.execute(query, {"cid": course_id})
        return curs.fetchall()

    @postgre_connection(__config)
    def get_hard_questions(self, course_id: int, limit: int = 8, curs: cursor = None) -> list[tuple]:
        """Самые сложные вопросы: (question_text, attempts, correct, success_rate, topic)."""
        query = """
            SELECT tra.question_text,
                   COUNT(*)                                                         AS attempts,
                   SUM(CASE WHEN tra.is_correct THEN 1 ELSE 0 END)                 AS correct,
                   ROUND(100.0 * SUM(CASE WHEN tra.is_correct THEN 1 ELSE 0 END)
                         / COUNT(*), 1)                                             AS success_rate,
                   tr.topic
            FROM test_result_answers tra
            JOIN test_results tr ON tra.test_result_id = tr.id
            WHERE tr.course_id = %(cid)s
            GROUP BY tra.question_text, tr.topic
            HAVING COUNT(*) >= 2
            ORDER BY success_rate ASC
            LIMIT %(limit)s
        """
        curs.execute(query, {"cid": course_id, "limit": limit})
        return curs.fetchall()

    @postgre_connection(__config)
    def get_difficulty_breakdown(self, course_id: int, curs: cursor = None) -> list[tuple]:
        """Результаты по уровню сложности: (difficulty, test_count, avg_pct)."""
        query = """
            SELECT tr.difficulty,
                   COUNT(DISTINCT tr.id)                 AS test_count,
                   ROUND(AVG(tr.percentage)::numeric, 1) AS avg_pct
            FROM test_results tr
            WHERE tr.course_id = %(cid)s
            GROUP BY tr.difficulty
            ORDER BY tr.difficulty
        """
        curs.execute(query, {"cid": course_id})
        return curs.fetchall()

    @postgre_connection(__config)
    def get_answers(self, test_result_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT question_num, question_text, options, user_answer,
                   correct_answer, is_correct
            FROM test_result_answers
            WHERE test_result_id = %s
            ORDER BY question_num
        """
        curs.execute(query, (test_result_id,))
        return curs.fetchall()
