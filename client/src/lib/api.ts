import type { CourseShort, Lab, PendingReportsResponse, ReportAnalysisResponse } from "@/types/models"

const API_BASE = "http://localhost:8000" // NEW FUNCTIONALITY: можно заменить на "http://localhost:8000"

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export async function getTeacherCourses(teacherId: number): Promise<CourseShort[]> {
  // NEW FUNCTIONALITY: курсы преподавателя
  return await fetchJSON<CourseShort[]>(`/api/v1/teachers/${teacherId}/courses`)
}

export async function getStudentCoursesById(studentId: number): Promise<CourseShort[]> {
  // NEW FUNCTIONALITY: курсы студента
  return await fetchJSON<CourseShort[]>(`/api/v1/students/${studentId}/courses`)
}

export async function listAllCourses(): Promise<{ id: number; title: string; teacher_id: number }[]> {
  // NEW FUNCTIONALITY: витрина курсов для студента
  return await fetchJSON(`/api/v1/courses`)
}

export async function createCourseAPI(payload: { title: string; teacher_id: string; exam_questions: string }) {
  // NEW FUNCTIONALITY: создание курса
  return await fetchJSON<{ success: boolean }>(`/api/v1/courses/create`, { method: "POST", body: JSON.stringify(payload) })
}

export async function getCourseById(courseId: number) {
  // NEW FUNCTIONALITY: инфо курса (возвращает список, как в текущем API)
  return await fetchJSON<any>(`/api/v1/course/${courseId}/info`)
}

export async function updateCourse(courseId: number, payload: any) {
  // NEW FUNCTIONALITY: обновление курса (для текущего UI)
  return await fetchJSON<{ success: boolean }>(`/api/v1/course/${courseId}`, { method: "PUT", body: JSON.stringify(payload) })
}

export async function deleteCourse(courseId: number) {
  // NEW FUNCTIONALITY: удаление курса
  return await fetchJSON<{ success: boolean }>(`/api/v1/course/${courseId}`, { method: "DELETE" })
}

export async function getCourseLabs(courseId: number): Promise<Lab[]> {
  // NEW FUNCTIONALITY: лабы курса
  return await fetchJSON<Lab[]>(`/api/v1/courses/${courseId}/labs`)
}

export async function createLab(payload: { number: number; title: string; task?: string; course_id: number }) {
  // NEW FUNCTIONALITY: создание лабы
  const { course_id, ...rest } = payload
  return await fetchJSON<{ success: boolean }>(`/api/v1/courses/${course_id}/labs`, { method: "POST", body: JSON.stringify(rest) })
}

export async function updateLab(labId: number, payload: { number: number; title: string; task?: string }) {
  // NEW FUNCTIONALITY: обновление лабы (для текущего UI)
  return await fetchJSON<{ success: boolean }>(`/api/v1/labs/${labId}`, { method: "PUT", body: JSON.stringify(payload) })
}

export async function deleteLab(labId: number) {
  // NEW FUNCTIONALITY: удаление лабы
  return await fetchJSON<{ success: boolean }>(`/api/v1/labs/${labId}`, { method: "DELETE" })
}

export async function addReport(student_id: number, lab_id: number, url: string): Promise<ReportAnalysisResponse> {
  // NEW FUNCTIONALITY: загрузка отчёта (verification pipeline)
  return await fetchJSON<ReportAnalysisResponse>(`/api/v1/reports`, {
    method: "POST",
    body: JSON.stringify({ student_id, lab_id, url }),
  })
}

export async function getPendingReports(teacherId: number): Promise<PendingReportsResponse> {
  // NEW FUNCTIONALITY: pending отчёты преподавателя (legacy endpoint оставлен)
  return await fetchJSON<PendingReportsResponse>(`/api/v1/courses/${teacherId}/pending_reports`)
}

export async function getCourseStudents(courseId: number): Promise<{ students: { id: number; first_name: string; last_name: string }[] }> {
  // NEW FUNCTIONALITY: студенты зачисленные на курс
  return await fetchJSON(`/api/v1/course/${courseId}/get_students`)
}

export async function createCourseRequest(courseId: number, studentId: number) {
  // NEW FUNCTIONALITY: студент отправляет заявку на курс
  return await fetchJSON<{ success: boolean; request_id: number }>(`/api/v1/courses/${courseId}/requests`, {
    method: "POST",
    body: JSON.stringify({ student_id: studentId }),
  })
}

export async function getCourseRequests(courseId: number) {
  // NEW FUNCTIONALITY: преподаватель получает заявки на курс
  return await fetchJSON<{ requests: any[] }>(`/api/v1/courses/${courseId}/requests`)
}

export async function approveCourseRequest(requestId: number) {
  // NEW FUNCTIONALITY: одобрить заявку
  return await fetchJSON<{ success: boolean }>(`/api/v1/course-requests/${requestId}/approve`, { method: "POST" })
}

export async function rejectCourseRequest(requestId: number) {
  // NEW FUNCTIONALITY: отклонить заявку
  return await fetchJSON<{ success: boolean }>(`/api/v1/course-requests/${requestId}/reject`, { method: "POST" })
}

export async function updateReport(reportId: number, payload: { status: "approved" | "rejected"; comment?: string }) {
  // NEW FUNCTIONALITY: смена статуса отчёта
  return await fetchJSON<{ success: boolean }>(`/api/v1/reports/${reportId}/status`, {
    method: "POST",
    body: JSON.stringify({ status: payload.status, comment: payload.comment }),
  })
}

export async function deleteReport(reportId: number) {
  // NEW FUNCTIONALITY: удаление отчёта
  return await fetchJSON<{ success: boolean }>(`/api/v1/reports/${reportId}`, { method: "DELETE" })
}

// ============ CHAT ============

export interface ChatInfo {
  chat_id: number
  name: string
  course_id: number
  course_title: string
  created_at: string
}

export interface ChatMessageDTO {
  role: "human" | "ai"
  content: string
}

export async function createChat(studentId: number, courseId: number, name?: string): Promise<{ chat_id: number; name: string }> {
  const form = new FormData()
  form.set("student_id", String(studentId))
  form.set("course_id", String(courseId))
  if (name) form.set("name", name)
  const res = await fetch(`${API_BASE}/api/v1/chats`, { method: "POST", body: form })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getStudentChats(studentId: number): Promise<ChatInfo[]> {
  return fetchJSON<ChatInfo[]>(`/api/v1/students/${studentId}/chats`)
}

export async function getChatMessages(chatId: number): Promise<ChatMessageDTO[]> {
  return fetchJSON<ChatMessageDTO[]>(`/api/v1/chats/${chatId}/messages`)
}

export async function deleteChat(chatId: number): Promise<{ success: boolean }> {
  return fetchJSON<{ success: boolean }>(`/api/v1/chats/${chatId}`, { method: "DELETE" })
}

export async function renameChat(chatId: number, name: string): Promise<{ success: boolean; name: string }> {
  const form = new FormData()
  form.set("name", name)
  const res = await fetch(`${API_BASE}/api/v1/chats/${chatId}`, { method: "PATCH", body: form })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function sendChatMessage(chatId: number, message: string): Promise<{ response: string }> {
  const form = new FormData()
  form.set("message", message)
  const res = await fetch(`${API_BASE}/api/v1/chats/${chatId}/messages`, { method: "POST", body: form })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

// ============ COURSE FILES ============

export interface CourseFileInfo {
  id: number
  filename: string
  file_id: string
  created_at: string
}

export async function getCourseFiles(courseId: number): Promise<{ files: CourseFileInfo[] }> {
  return fetchJSON<{ files: CourseFileInfo[] }>(`/api/v1/courses/${courseId}/files`)
}

export async function deleteCourseFile(courseId: number, fileRecordId: number): Promise<{ success: boolean }> {
  return fetchJSON<{ success: boolean }>(`/api/v1/courses/${courseId}/files/${fileRecordId}`, { method: "DELETE" })
}

// ============ FILE UPLOAD ============

export async function uploadCourseFiles(courseId: number, files: File[]): Promise<{ success: boolean; indexed: { filename: string; file_id: string }[] }> {
  const form = new FormData()
  for (const file of files) {
    form.append("files", file)
  }
  const res = await fetch(`${API_BASE}/api/v1/courses/${courseId}/upload-files`, { method: "POST", body: form })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

// export async function submitExamAnswer(courseId: number, payload: { exam_id: string; answer: string }) {
//   // NEW FUNCTIONALITY: экзамен
//   return await fetchJSON<any>(`/courses/${courseId}/exam/answer`, { method: "POST", body: JSON.stringify(payload) })
// }

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // if (MOCK_MODE) {
  //   await new Promise((resolve) => setTimeout(resolve, 300))
  //   return handleMockRequest<T>(endpoint, options)
  // }

  const url = `${API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (response.status === 204) {
      return {} as T
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "Unknown error",
      }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error)
    throw error
  }
}

export async function submitExamAnswer(
  courseId: number,
  examId: string,
  answer: string
): Promise<any> {
  return fetchAPI<any>(`/courses/${courseId}/exam/answer`, {
    method: "POST",
    body: JSON.stringify({
      exam_id: examId,
      answer: answer,
    }),
  });
}

export interface CourseAnalytics {
  test_averages: { student_id: number; first_name: string; last_name: string; test_count: number; avg_percentage: number | null }[]
  exam_averages: { student_id: number; first_name: string; last_name: string; exam_count: number; avg_score: number | null }[]
  report_statuses: { student_id: number; first_name: string; last_name: string; lab_title: string; status: string }[]
  test_timeline: { student_id: number; first_name: string; last_name: string; percentage: number | null; topic: string; created_at: string }[]
}

export async function getCourseAnalytics(courseId: number): Promise<CourseAnalytics> {
  return fetchJSON<CourseAnalytics>(`/api/v1/courses/${courseId}/analytics`)
}

// ============ STUDENT RESULTS BY COURSE ============

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

export async function getStudentTestResultsByCourse(studentId: number, courseId: number): Promise<{ results: StudentTestResult[] }> {
  return fetchJSON(`/api/v1/students/${studentId}/courses/${courseId}/test-results`)
}

export async function getStudentExamResultsByCourse(studentId: number, courseId: number): Promise<{ results: StudentExamResult[] }> {
  return fetchJSON(`/api/v1/students/${studentId}/courses/${courseId}/exam-results`)
}

export async function getStudentReportsByCourse(studentId: number, courseId: number): Promise<{ reports: StudentReportResult[] }> {
  return fetchJSON(`/api/v1/students/${studentId}/courses/${courseId}/reports`)
}