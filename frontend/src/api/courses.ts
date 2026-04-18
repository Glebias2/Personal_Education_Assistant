import { apiFetch, apiUpload } from "./client";

export interface Course {
  id: number;
  title: string;
  teacher_id: number;
  description: string;
  difficulty: string;
  created_at: string;
  tags: string[];
}

export interface CourseInfo extends Course {
  exam_questions: string;
  storage_id: string;
}

export interface CourseFile {
  id: number;
  filename: string;
  file_id: string;
  created_at: string;
}

export interface CourseRequest {
  id: number;
  student_id: number;
  first_name: string;
  last_name: string;
  status?: string;
}

export interface CourseStudent {
  id: number;
  first_name: string;
  last_name: string;
}

export interface CourseRef {
  id: number;
  title: string;
}

/** Курс с данными о завершении и оценке студента */
export interface CourseWithStatus extends Course {
  is_completed: boolean;
  my_rating: number | null;
}

export const coursesApi = {
  getAll: () => apiFetch<Course[]>("/api/v1/courses"),

  getInfo: (id: number) =>
    apiFetch<CourseInfo[]>(`/api/v1/course/${id}/info`).then((arr) => arr[0]),

  /** Быстрый список id+title (для Dashboard) */
  getStudentCourses: (studentId: number) =>
    apiFetch<CourseRef[]>(`/api/v1/students/${studentId}/courses`),

  /** Полные данные курсов с is_completed и my_rating (для MyCourses) */
  getStudentCoursesFull: (studentId: number) =>
    apiFetch<CourseWithStatus[]>(`/api/v1/students/${studentId}/courses`),

  getTeacherCourses: (teacherId: number) =>
    apiFetch<CourseRef[]>(`/api/v1/teachers/${teacherId}/courses`),

  create: (data: {
    title: string;
    teacher_id: number;
    description: string;
    difficulty: string;
    tags: string[];
    exam_questions: string;
  }) =>
    apiFetch<Course>("/api/v1/courses/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CourseInfo>) =>
    apiFetch(`/api/v1/course/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  uploadFiles: (courseId: number, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return apiUpload(`/api/v1/courses/${courseId}/upload-files`, fd);
  },

  getFiles: (courseId: number) =>
    apiFetch<{ files: CourseFile[] }>(`/api/v1/courses/${courseId}/files`).then(
      (r) => r.files
    ),

  deleteFile: (courseId: number, fileRecordId: number) =>
    apiFetch(`/api/v1/courses/${courseId}/files/${fileRecordId}`, {
      method: "DELETE",
    }),

  downloadFile: (courseId: number, fileId: string) =>
    `/api/v1/courses/${courseId}/files/${fileId}/download`,

  sendRequest: (courseId: number, studentId: number) =>
    apiFetch(`/api/v1/courses/${courseId}/requests`, {
      method: "POST",
      body: JSON.stringify({ student_id: studentId }),
    }),

  getRequests: (courseId: number) =>
    apiFetch<{ requests: CourseRequest[] }>(
      `/api/v1/courses/${courseId}/requests`
    ).then((r) => r.requests),

  approveRequest: (requestId: number) =>
    apiFetch(`/api/v1/course-requests/${requestId}/approve`, {
      method: "POST",
    }),

  rejectRequest: (requestId: number) =>
    apiFetch(`/api/v1/course-requests/${requestId}/reject`, {
      method: "POST",
    }),

  getStudents: (courseId: number) =>
    apiFetch<{ students: CourseStudent[] }>(
      `/api/v1/course/${courseId}/get_students`
    ),

  getAnalytics: (courseId: number) =>
    apiFetch<CourseAnalytics>(`/api/v1/courses/${courseId}/analytics`),
};

export interface CourseAnalytics {
  test_averages: {
    student_id: number;
    first_name: string;
    last_name: string;
    test_count: number;
    avg_percentage: number | null;
  }[];
  exam_averages: {
    student_id: number;
    first_name: string;
    last_name: string;
    exam_count: number;
    avg_score: number | null;
  }[];
  report_statuses: {
    student_id: number;
    first_name: string;
    last_name: string;
    lab_title: string;
    status: string;
  }[];
  test_timeline: {
    student_id: number;
    first_name: string;
    last_name: string;
    percentage: number | null;
    topic: string;
    created_at: string;
  }[];
  topic_accuracy: {
    topic: string;
    total_q: number;
    correct_q: number;
    accuracy_pct: number;
    test_count: number;
  }[];
  hard_questions: {
    question_text: string;
    attempts: number;
    correct: number;
    success_rate: number;
    topic: string;
  }[];
  difficulty_breakdown: {
    difficulty: string;
    test_count: number;
    avg_pct: number;
  }[];
  verdict_distribution: {
    verdict: string;
    count: number;
  }[];
  lab_funnel: {
    id: number;
    number: number;
    title: string;
    enrolled: number;
    submitted: number;
    approved: number;
    rejected: number;
  }[];
}
