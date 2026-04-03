import { API_BASE, fetchJSON } from "./helpers"

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
