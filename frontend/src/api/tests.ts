import { apiFetch, apiUpload } from "./client";

export interface TestQuestion {
  question_num: number;
  text: string;
  options: Record<string, string>;
  type: string;
}

export interface TestGenResponse {
  success: boolean;
  total_questions: number;
  difficulty: string;
  questions: TestQuestion[];
  error?: string;
}

export interface TestEvalResponse {
  success: boolean;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  percentage: number;
  error?: string;
}

export interface TestResult {
  id: number;
  course_id: number;
  topic: string;
  source?: string;
  difficulty: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  percentage: number;
  created_at: string;
}

export interface TestAnswer {
  question_num: number;
  question_text: string;
  options: Record<string, string>;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export const testsApi = {
  generateByTopic: (data: {
    topic: string;
    course_id: number;
    num_questions?: number;
    difficulty?: string;
  }) =>
    apiFetch<TestGenResponse>("/api/v1/tests/generate-by-topic", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadFile: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiUpload<{ success: boolean; error?: string }>(
      "/api/v1/tests/upload",
      fd
    );
  },

  generateByFile: (data: { num_questions?: number; difficulty?: string }) =>
    apiFetch<TestGenResponse>("/api/v1/tests/generate-by-file", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submit: (data: { answers: string[]; student_id: number; course_id: number }) =>
    apiFetch<TestEvalResponse>("/api/v1/tests/submit", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStudentResults: (studentId: number) =>
    apiFetch<{ results: TestResult[] }>(
      `/api/v1/students/${studentId}/test-results`
    ).then((r) => r.results),

  getCourseResults: (courseId: number, studentId: number) =>
    apiFetch<{ results: TestResult[] }>(
      `/api/v1/students/${studentId}/courses/${courseId}/test-results`
    ).then((r) => r.results),

  getAnswers: (resultId: number) =>
    apiFetch<{ answers: TestAnswer[] }>(
      `/api/v1/test-results/${resultId}/answers`
    ).then((r) => r.answers),
};
