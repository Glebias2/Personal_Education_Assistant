import { apiFetch } from "./client";

export interface Lab {
  id: number;
  number: number;
  title: string;
  task: string;
}

export const labsApi = {
  getAll: (courseId: number) =>
    apiFetch<Lab[]>(`/api/v1/courses/${courseId}/labs`),

  create: (courseId: number, data: { number: number; title: string; task: string }) =>
    apiFetch<Lab>(`/api/v1/courses/${courseId}/labs`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (labId: number, data: Partial<Lab>) =>
    apiFetch(`/api/v1/labs/${labId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (labId: number) =>
    apiFetch(`/api/v1/labs/${labId}`, { method: "DELETE" }),
};
