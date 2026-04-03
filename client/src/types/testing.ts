/** Вопрос теста (GET /generate-by-topic или /generate-by-file) */
export interface TestQuestion {
  question_num: number;
  text: string;
  options: Record<string, string>;
  correct_answer?: string;
  type: string;
}

export interface TestAnswer {
  question_num: number;
  answer: string;
}

export interface TestSubmitRequest {
  course_id: number;
  student_id: number;
  answers: TestAnswer[];
}

export interface TestEvaluationResult {
  question_num: number;
  question_text: string;
  options: Record<string, string>;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export interface TestResult {
  results: TestEvaluationResult[];
  score: number;
  total: number;
}

/** Ответ от генерации теста (POST /generate-by-topic, POST /generate-by-file) */
export interface TestGenerationResponse {
  success: boolean;
  total_questions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: TestQuestion[];
  error: string | null;
}

/** Ответ от проверки теста (POST /submit) */
export interface TestSubmitResponse {
  success: boolean;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  percentage: number;
  error: string | null;
}

/** Ответ от загрузки файла (POST /upload) */
export interface FileUploadResponse {
  success: boolean;
  message: string;
  material_length: number;
}
