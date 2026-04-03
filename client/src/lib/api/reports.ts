import type { PendingReportsResponse, ReportAnalysisResponse } from "@/types"
import { fetchJSON } from "./helpers"

export async function addReport(student_id: number, lab_id: number, url: string): Promise<ReportAnalysisResponse> {
  return fetchJSON<ReportAnalysisResponse>(`/api/v1/reports`, {
    method: "POST",
    body: JSON.stringify({ student_id, lab_id, url }),
  })
}

export async function getPendingReports(teacherId: number): Promise<PendingReportsResponse> {
  return fetchJSON<PendingReportsResponse>(`/api/v1/teachers/${teacherId}/reports/pending`)
}

export async function updateReport(reportId: number, payload: { status: "approved" | "rejected"; comment?: string }) {
  return fetchJSON<{ success: boolean }>(`/api/v1/reports/${reportId}/status`, {
    method: "POST",
    body: JSON.stringify({ status: payload.status, comment: payload.comment }),
  })
}

export async function deleteReport(reportId: number) {
  return fetchJSON<{ success: boolean }>(`/api/v1/reports/${reportId}`, { method: "DELETE" })
}
