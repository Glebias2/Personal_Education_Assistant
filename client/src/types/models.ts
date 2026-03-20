/**
 * =============================================================================
 * TypeScript интерфейсы для моделей данных
 * =============================================================================
 * 
 * СООТВЕТСТВУЕТ СХЕМЕ БАЗЫ ДАННЫХ:
 * 
 * students (Студенты)
 *   - id, login, password, telegram_id, first_name, last_name, characteristic
 *   - Связи: один студент → много отчётов (reports)
 *            студенты ↔ курсы (через students_courses)
 * 
 * teachers (Преподаватели)
 *   - id, login, password, telegram_id, first_name, last_name
 *   - Связи: один преподаватель → много курсов (courses)
 * 
 * courses (Курсы)
 *   - id, title, teacher_id, exam_questions, vector_storage_id
 *   - Связи: принадлежит преподавателю, имеет много лаб, много отчётов
 * 
 * labs (Лабораторные работы)
 *   - id, number, title, task, course_id
 *   - Связи: принадлежит курсу
 * 
 * reports (Отчёты)
 *   - id, student_id, course_id, status, url, comment
 *   - Связи: принадлежит студенту и курсу
 * 
 * students_courses (Связь многие-ко-многим)
 *   - student_id, course_id
 * 
 * Базовый URL API: http://localhost:8000
 * 
 * =============================================================================
 */

// =============================================================================
// ========== СТУДЕНТЫ (STUDENTS) ==========
// =============================================================================
export interface Student {
  id: number;
  login: string;
  password?: string;
  telegram_id?: number;
  first_name: string;
  last_name: string;
  characteristic?: string;
}

export interface StudentCreate {
  login: string;
  password: string;
  telegram_id?: number;
  first_name: string;
  last_name: string;
  characteristic?: string;
}

// =============================================================================
// ========== ПРЕПОДАВАТЕЛИ (TEACHERS) ==========
// =============================================================================
export interface Teacher {
  first_name: string;
  last_name: string;
}

export interface TeacherAuth {
  success: boolean;
  teacher_id: number;
}

export interface TeacherCreate {
  login: string;
  password: string;
  telegram_id?: number;
  first_name: string;
  last_name: string;
}

// =============================================================================
// ========== КУРСЫ (COURSES) ==========
// =============================================================================
export interface Course {
  id: number;
  title: string;
  teacher_id: number;
  exam_questions?: string;
  vector_storage_id?: string;
}

export interface CourseCreate {
  title: string;
  teacher_id: number;
  exam_questions?: string;
  vector_storage_id?: string;
}

export interface ExamAnswerResponse {
  question_id: number;
  question_text: string;
  user_answer: string;
  verdict: string;
  recommendation: string;
  issues: string[];
  score: string; // или number, если бэкенд возвращает число
  raw_feedback: string;
}

export interface PendingReport {
  student_id: number;
  course_title: string;
  lab_title: string;
  url: string;
}

export interface PendingReportsResponse {
  reports: PendingReport[];
}

// Один студент в ответе
export interface CourseStudent {
  id: number;
  first_name: string;
  last_name: string;
}

// Ответ API
export interface CourseStudentsResponse {
  students: CourseStudent[];
}
/**
 * Краткая информация о курсе
 * 
 * БЭКЕНД: GET /api/v1/teachers/{teacher_id}/courses
 * БЭКЕНД: GET /api/v1/students/{student_id}/courses
 * 
 * Возвращается при получении списка курсов преподавателя или студента
 */
export interface CourseShort {
  id: number;
  title: string;
}

// =============================================================================
// ========== ЛАБОРАТОРНЫЕ РАБОТЫ (LABS) ==========
// =============================================================================
export interface Lab {
  id: number;
  number: number;
  title: string;
  task?: string;
  course_id: number;
}

export interface LabCreate {
  number: number;
  title: string;
  task?: string;
  course_id: number;
}

export interface ChatResponse {
  response: string;
}

// =============================================================================
// ========== ОТЧЁТЫ (REPORTS) ==========
// =============================================================================
export interface Report {
  id: number;
  student_id: number;
  course_id: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  url?: string;
  comment?: string;
}

export interface ReportCreate {
  student_id: number;
  course_id: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  url?: string;
  comment?: string;
}

// =============================================================================
// ========== СВЯЗЬ СТУДЕНТЫ-КУРСЫ (STUDENTS_COURSES) ==========
// =============================================================================
export interface StudentCourse {
  student_id: number;
  course_id: number;
}

// =============================================================================
// ========== РЕКОМЕНДАЦИИ АГЕНТА ==========
// =============================================================================
export interface ReportRecommendation {
  id: number;
  report_id: number;
  type: 'student' | 'teacher';
  text: string;
  quality?: 'good' | 'needs_improvement' | 'poor';
  created_at?: string;
}

export interface ReportAnalysisResponse {
  status: "loaded" | "rejected";
  message?: string; // есть только если status === "rejected"
  id?: number;      // если нужно для сохранения черновика
}

// =============================================================================
// ========== ТЕСТИРОВАНИЕ (TESTING) ==========
// =============================================================================

/**
 * Вопрос теста (для тестов по теме или файлу)
 * 
 * БЭКЕНД: POST /generate-by-topic или POST /generate-by-file
 */
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

/**
 * Ответ от генерации теста
 * 
 * БЭКЕНД: POST /generate-by-topic, POST /generate-by-file
 */
export interface TestGenerationResponse {
  success: boolean;
  total_questions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: TestQuestion[];
  error: string | null;
}

/**
 * Ответ от проверки теста
 * 
 * БЭКЕНД: POST /submit
 */
export interface TestSubmitResponse {
  success: boolean;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  percentage: number;
  error: string | null;
}

/**
 * Ответ от загрузки файла
 * 
 * БЭКЕНД: POST /upload
 */
export interface FileUploadResponse {
  success: boolean;
  message: string;
  material_length: number;
}

// =============================================================================
// ========== ПРОБНЫЙ ЭКЗАМЕН (EXAM) ==========
// =============================================================================

/**
 * Вопрос экзамена
 * 
 * БЭКЕНД: POST /courses/{course_id}/exam/start
 * БЭКЕНД: POST /courses/{course_id}/exam/answer
 */
export interface ExamQuestion {
  id: number;
  text: string;
  reference_answer: string | null;
}

/**
 * Ответ на старт экзамена
 * 
 * БЭКЕНД: POST /courses/{course_id}/exam/start
 * Body: { question_count: number, language: "ru" }
 */
export interface ExamStartResponse {
  exam_id: string;
  question: ExamQuestion;
  has_more_questions: boolean;
}

export interface ReportFeedback {
  status: string;
  message?: string; // может быть или отсутствовать
}

/**
 * Оценка ответа студента
 * 
 * БЭКЕНД: POST /courses/{course_id}/exam/answer
 */
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

/**
 * Ответ на ответ студента
 * 
 * БЭКЕНД: POST /courses/{course_id}/exam/answer
 * Body: { exam_id: string, answer: string }
 */
export interface ExamAnswerResponse {
  evaluation: ExamEvaluation;
  next_question: ExamQuestion | null;
  has_more_questions: boolean;
  completed: boolean;
}

/**
 * Результат по вопросу в сводке
 */
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

/**
 * Сводка по экзамену
 * 
 * БЭКЕНД: GET /courses/{course_id}/summary
 */
export interface ExamSummaryResponse {
  exam_id: string;
  course_id: number;
  completed: boolean;
  pending_question: ExamQuestion | null;
  results: ExamResultItem[];
}

// =============================================================================
// ========== ВСПОМОГАТЕЛЬНЫЕ ТИПЫ ==========
// =============================================================================
export type UserRole = 'student' | 'teacher';

export interface AuthUser {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface ReportFilterParams extends PaginationParams {
  status_filter?: string;
  student_id?: number;
  course_id?: number;
}
