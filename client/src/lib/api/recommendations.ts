import type { RecommendedCoursesResponse } from "@/types"
import { fetchJSON } from "./helpers"

export async function createCourseRequest(courseId: number, studentId: number) {
  return fetchJSON<{ success: boolean; request_id: number }>(`/api/v1/courses/${courseId}/requests`, {
    method: "POST",
    body: JSON.stringify({ student_id: studentId }),
  })
}

export async function getCourseRequests(courseId: number) {
  return fetchJSON<{ requests: any[] }>(`/api/v1/courses/${courseId}/requests`)
}

export async function approveCourseRequest(requestId: number) {
  return fetchJSON<{ success: boolean }>(`/api/v1/course-requests/${requestId}/approve`, { method: "POST" })
}

export async function rejectCourseRequest(requestId: number) {
  return fetchJSON<{ success: boolean }>(`/api/v1/course-requests/${requestId}/reject`, { method: "POST" })
}

export async function getAvailableTags(): Promise<{ tags: string[] }> {
  return fetchJSON(`/api/v1/tags`)
}

export async function getRecommendedCourses(studentId: number): Promise<RecommendedCoursesResponse> {
  return fetchJSON(`/api/v1/students/${studentId}/recommended-courses`)
}

export async function getStudentInterests(studentId: number): Promise<{ interests: string[] }> {
  return fetchJSON(`/api/v1/students/${studentId}/interests`)
}

export async function updateStudentInterests(studentId: number, interests: string[]): Promise<{ success: boolean }> {
  return fetchJSON(`/api/v1/students/${studentId}/interests`, {
    method: "PUT",
    body: JSON.stringify({ interests }),
  })
}

export async function getCourseTags(courseId: number): Promise<{ tags: string[] }> {
  return fetchJSON(`/api/v1/courses/${courseId}/tags`)
}

export async function updateCourseTags(courseId: number, tags: string[]): Promise<{ success: boolean }> {
  return fetchJSON(`/api/v1/courses/${courseId}/tags`, {
    method: "PUT",
    body: JSON.stringify({ tags }),
  })
}

export async function getCourseRating(courseId: number, studentId: number): Promise<{ rating: number | null }> {
  return fetchJSON(`/api/v1/courses/${courseId}/rating?student_id=${studentId}`)
}

export async function rateCourse(courseId: number, studentId: number, rating: number): Promise<{ success: boolean }> {
  return fetchJSON(`/api/v1/courses/${courseId}/rate`, {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, rating }),
  })
}
