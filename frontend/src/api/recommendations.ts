import { apiFetch } from "./client";
import type { Course } from "./courses";

export interface RecommendedCourses {
  recommended: Course[];
  other: Course[];
  has_recommendations: boolean;
  maybe_like: Course | null;
}

export const recommendationsApi = {
  getTags: () =>
    apiFetch<{ tags: string[] }>("/api/v1/tags").then((r) => r.tags),

  getRecommended: (studentId: number) =>
    apiFetch<RecommendedCourses>(
      `/api/v1/students/${studentId}/recommended-courses`
    ),

  getInterests: (studentId: number) =>
    apiFetch<{ interests: string[] }>(
      `/api/v1/students/${studentId}/interests`
    ).then((r) => r.interests),

  updateInterests: (studentId: number, interests: string[]) =>
    apiFetch(`/api/v1/students/${studentId}/interests`, {
      method: "PUT",
      body: JSON.stringify({ interests }),
    }),

  rateCourse: (courseId: number, data: { student_id: number; rating: number }) =>
    apiFetch(`/api/v1/courses/${courseId}/rate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCourseTags: (courseId: number) =>
    apiFetch<{ tags: string[] }>(`/api/v1/courses/${courseId}/tags`).then(
      (r) => r.tags
    ),

  updateCourseTags: (courseId: number, tags: string[]) =>
    apiFetch(`/api/v1/courses/${courseId}/tags`, {
      method: "PUT",
      body: JSON.stringify({ tags }),
    }),
};
