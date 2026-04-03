/** Вопрос экзамена (POST /courses/{course_id}/exam/start) */
export interface ExamQuestion {
  id: number;
  text: string;
  reference_answer: string | null;
}

/** Ответ на старт экзамена */
export interface ExamStartResponse {
  exam_id: string;
  question: ExamQuestion;
  has_more_questions: boolean;
}

/** Оценка ответа студента (POST /courses/{course_id}/exam/answer) */
export interface ExamEvaluation {
  question_id: number;
  question_text: string;
  user_answer: string;
  verdict: string;
  recommendation: string;
  issues: string[];
  score: string;
  raw_feedback: string;
}

/** Ответ на ответ студента */
export interface ExamAnswerResponse {
  evaluation: ExamEvaluation;
  next_question: ExamQuestion | null;
  has_more_questions: boolean;
  completed: boolean;
}

export interface ExamResultItem {
  question_id: number;
  question_text: string;
  user_answer: string;
  verdict: string;
  recommendation: string;
  issues: string[];
  score: string;
  raw_feedback: string;
}

/** Сводка по экзамену (GET /courses/{course_id}/summary) */
export interface ExamSummaryResponse {
  exam_id: string;
  course_id: number;
  completed: boolean;
  pending_question: ExamQuestion | null;
  results: ExamResultItem[];
}
