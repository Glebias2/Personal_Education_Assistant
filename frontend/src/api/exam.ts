import { apiFetch } from "./client";

export interface ExamQuestion {
  id: number;
  text: string;
  reference_answer?: string;
}

export interface ExamStartResponse {
  exam_id: string;
  question: ExamQuestion;
  has_more_questions: boolean;
}

export interface ExamResultPayload {
  question_id: number;
  question_text: string;
  user_answer: string;
  verdict: string;
  recommendation: string;
  issues: string[];
  score?: string;
  raw_feedback?: string;
}

export interface ExamAnswerResponse {
  evaluation: ExamResultPayload;
  next_question?: ExamQuestion;
  has_more_questions: boolean;
  completed: boolean;
}

export interface ExamSummary {
  exam_id: string;
  course_id: number;
  completed: boolean;
  results: ExamResultPayload[];
  pending_question?: ExamQuestion;
}

export interface ExamResult {
  id: number;
  course_id: number;
  total_questions: number;
  avg_score: number | null;
  completed: boolean;
  created_at: string;
}

export const examApi = {
  start: (
    courseId: number,
    data: {
      student_id: number;
      question_count: number;
      language: string;
    }
  ) =>
    apiFetch<ExamStartResponse>(`/api/v1/courses/${courseId}/exam/start`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  answer: (courseId: number, data: { exam_id: string; answer: string }) =>
    apiFetch<ExamAnswerResponse>(`/api/v1/courses/${courseId}/exam/answer`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  summary: (courseId: number, examId: string) =>
    apiFetch<ExamSummary>(
      `/api/v1/courses/${courseId}/summary?exam_id=${examId}`
    ),

  getStudentResults: (studentId: number) =>
    apiFetch<{ results: ExamResult[] }>(
      `/api/v1/students/${studentId}/exam-results`
    ).then((r) => r.results),

  getCourseResults: (courseId: number, studentId: number) =>
    apiFetch<{ results: ExamResult[] }>(
      `/api/v1/students/${studentId}/courses/${courseId}/exam-results`
    ).then((r) => r.results),
};
