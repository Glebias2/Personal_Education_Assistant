import type { CourseShort, Lab } from "@/types"
import { fetchJSON } from "./helpers"

export async function getTeacherCourses(teacherId: number): Promise<CourseShort[]> {
  return fetchJSON<CourseShort[]>(`/api/v1/teachers/${teacherId}/courses`)
}

export async function getStudentCoursesById(studentId: number): Promise<CourseShort[]> {
  return fetchJSON<CourseShort[]>(`/api/v1/students/${studentId}/courses`)
}

export async function listAllCourses(): Promise<{ id: number; title: string; teacher_id: number }[]> {
  return fetchJSON(`/api/v1/courses`)
}

export async function createCourseAPI(payload: {
  title: string;
  teacher_id: string;
  exam_questions: string;
  description?: string;
  difficulty?: string;
  tags?: string[];
}) {
  return fetchJSON<{ success: boolean; course_id?: number }>(`/api/v1/courses/create`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getCourseById(courseId: number) {
  return fetchJSON<any>(`/api/v1/course/${courseId}/info`)
}

export async function updateCourse(courseId: number, payload: any) {
  return fetchJSON<{ success: boolean }>(`/api/v1/course/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteCourse(courseId: number) {
  return fetchJSON<{ success: boolean }>(`/api/v1/course/${courseId}`, { method: "DELETE" })
}

export async function getCourseStudents(courseId: number): Promise<{ students: { id: number; first_name: string; last_name: string }[] }> {
  return fetchJSON(`/api/v1/course/${courseId}/get_students`)
}
