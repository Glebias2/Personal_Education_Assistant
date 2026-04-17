import { apiFetch } from "./client";

export interface Report {
  report_id: number;
  student_id: number;
  course_title?: string;
  lab_title?: string;
  url: string;
  status?: string;
  comment?: string;
  lab_id?: number;
  course_id?: number;
}

export const reportsApi = {
  submit: (data: {
    student_id: number;
    lab_id: number;
    url: string;
  }) =>
    apiFetch<{ status: string; message?: string }>("/api/v1/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPending: (teacherId: number) =>
    apiFetch<{ reports: Report[] }>(
      `/api/v1/teachers/${teacherId}/reports/pending`
    ),

  getStudentReports: (studentId: number) =>
    apiFetch<{ reports: Report[] }>(
      `/api/v1/students/${studentId}/reports`
    ).then((r) => r.reports),

  updateStatus: (
    reportId: number,
    data: { status: string; comment?: string }
  ) =>
    apiFetch(`/api/v1/reports/${reportId}/status`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (reportId: number) =>
    apiFetch(`/api/v1/reports/${reportId}`, { method: "DELETE" }),
};
