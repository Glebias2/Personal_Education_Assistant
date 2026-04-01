import json
from psycopg2.extensions import cursor

from settings import EducationDatabaseConfig
from ..connection import postgre_connection


class ExamResultRepository:
    __config = EducationDatabaseConfig()

    @postgre_connection(__config)
    def save(
        self,
        *,
        student_id: int,
        course_id: int,
        total_questions: int,
        avg_score: float | None,
        completed: bool,
        answers: list[dict],
        curs: cursor = None,
    ) -> int:
        """Сохраняет результат экзамена и детали ответов. Возвращает id результата."""
        query = """
            INSERT INTO exam_results
                (student_id, course_id, total_questions, avg_score, completed)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """
        curs.execute(query, (student_id, course_id, total_questions, avg_score, completed))
        result_id = curs.fetchone()[0]

        for ans in answers:
            detail_query = """
                INSERT INTO exam_result_answers
                    (exam_result_id, question_id, question_text, user_answer,
                     verdict, recommendation, issues, score)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            curs.execute(detail_query, (
                result_id,
                ans["question_id"],
                ans["question_text"],
                ans["user_answer"],
                ans["verdict"],
                ans.get("recommendation", ""),
                json.dumps(ans.get("issues", []), ensure_ascii=False),
                ans.get("score"),
            ))

        return result_id

    @postgre_connection(__config)
    def get_by_student(self, student_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT id, course_id, total_questions, avg_score, completed,
                   created_at::text
            FROM exam_results
            WHERE student_id = %s
            ORDER BY created_at DESC
        """
        curs.execute(query, (student_id,))
        return curs.fetchall()

    @postgre_connection(__config)
    def get_by_student_and_course(self, student_id: int, course_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT id, total_questions, avg_score, completed,
                   created_at::text
            FROM exam_results
            WHERE student_id = %s AND course_id = %s
            ORDER BY created_at DESC
        """
        curs.execute(query, (student_id, course_id))
        return curs.fetchall()

    @postgre_connection(__config)
    def get_course_analytics(self, course_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT er.student_id, s.first_name, s.last_name,
                   COUNT(*) AS exam_count,
                   AVG(er.avg_score) AS avg_score
            FROM exam_results er
            JOIN students s ON s.id = er.student_id
            WHERE er.course_id = %s AND er.completed = true
            GROUP BY er.student_id, s.first_name, s.last_name
            ORDER BY avg_score DESC
        """
        curs.execute(query, (course_id,))
        return curs.fetchall()

    @postgre_connection(__config)
    def get_answers(self, exam_result_id: int, curs: cursor = None) -> list[tuple]:
        query = """
            SELECT question_id, question_text, user_answer, verdict,
                   recommendation, issues, score
            FROM exam_result_answers
            WHERE exam_result_id = %s
            ORDER BY question_id
        """
        curs.execute(query, (exam_result_id,))
        return curs.fetchall()
