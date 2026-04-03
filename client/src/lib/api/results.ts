import { fetchJSON, fetchAPI } from "./helpers"

export interface CourseAnalytics {
  test_averages: { student_id: number; first_name: string; last_name: string; test_count: number; avg_percentage: number | null }[]
  exam_averages: { student_id: number; first_name: string; last_name: string; exam_count: number; avg_score: number | null }[]
  report_statuses: { student_id: number; first_name: string; last_name: string; lab_title: string; status: string }[]
  test_timeline: { student_id: number; first_name: string; last_name: string; percentage: number | null; topic: string; created_at: string }[]
}

export interface StudentTestResult {
  id: number
  topic: string | null
  source: string
  difficulty: string
  total_questions: number
  correct_answers: number
  wrong_answers: number
  percentage: number
  created_at: string
}

export interface StudentExamResult {
  id: number
  total_questions: number
  avg_score: number | null
  completed: boolean
  created_at: string
}

export interface StudentReportResult {
  id: number
  lab_title: string
  url: string | null
  status: string
  comment: string | null
}

export async function getCourseAnalytics(courseId: number): Promise<CourseAnalytics> {
  return fetchJSON<CourseAnalytics>(`/api/v1/courses/${courseId}/analytics`)
}

export async function getStudentTestResultsByCourse(studentId: number, courseId: number): Promise<{ results: StudentTestResult[] }> {
  return fetchJSON(`/api/v1/students/${studentId}/courses/${courseId}/test-results`)
}

export async function getStudentExamResultsByCourse(studentId: number, courseId: number): Promise<{ results: StudentExamResult[] }> {
  return fetchJSON(`/api/v1/students/${studentId}/courses/${courseId}/exam-results`)
}

export async function getStudentReportsByCourse(studentId: number, courseId: number): Promise<{ reports: StudentReportResult[] }> {
  return fetchJSON(`/api/v1/students/${studentId}/courses/${courseId}/reports`)
}

export async function submitExamAnswer(courseId: number, examId: string, answer: string): Promise<any> {
  return fetchAPI<any>(`/api/v1/courses/${courseId}/exam/answer`, {
    method: "POST",
    body: JSON.stringify({ exam_id: examId, answer }),
  })
}
