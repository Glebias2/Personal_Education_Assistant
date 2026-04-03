import type { Lab } from "@/types"
import { fetchJSON } from "./helpers"

export async function getCourseLabs(courseId: number): Promise<Lab[]> {
  return fetchJSON<Lab[]>(`/api/v1/courses/${courseId}/labs`)
}

export async function createLab(payload: { number: number; title: string; task?: string; course_id: number }) {
  const { course_id, ...rest } = payload
  return fetchJSON<{ success: boolean }>(`/api/v1/courses/${course_id}/labs`, {
    method: "POST",
    body: JSON.stringify(rest),
  })
}

export async function updateLab(labId: number, payload: { number: number; title: string; task?: string }) {
  return fetchJSON<{ success: boolean }>(`/api/v1/labs/${labId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteLab(labId: number) {
  return fetchJSON<{ success: boolean }>(`/api/v1/labs/${labId}`, { method: "DELETE" })
}
