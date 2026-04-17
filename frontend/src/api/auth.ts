import { apiFetch } from "./client";

export interface AuthResponse {
  success: boolean;
  student_id?: number;
  teacher_id?: number;
}

export interface StudentProfile {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  characteristic?: string;
}

export interface StudentPreferences {
  preferred_explanation_style: string | null;
  notes: string | null;
}

export interface TeacherProfile {
  first_name: string;
  last_name: string;
}

export const authApi = {
  studentLogin: (login: string, password: string) =>
    apiFetch<AuthResponse>("/students/auth", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }),

  studentRegister: (data: {
    login: string;
    password: string;
    first_name: string;
    last_name: string;
    characteristic?: string;
    interests?: string[];
  }) =>
    apiFetch<AuthResponse>("/students/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  teacherLogin: (login: string, password: string) =>
    apiFetch<AuthResponse>("/teachers/auth", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }),

  teacherRegister: (data: {
    login: string;
    password: string;
    first_name: string;
    last_name: string;
  }) =>
    apiFetch<AuthResponse>("/teachers/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStudent: (id: number) => apiFetch<StudentProfile>(`/students/${id}`),
  getTeacher: (id: number) => apiFetch<TeacherProfile>(`/teachers/${id}`),

  getPreferences: (id: number) =>
    apiFetch<StudentPreferences>(`/students/${id}/preferences`),

  updatePreferences: (id: number, data: { preferred_explanation_style: string; notes: string }) =>
    apiFetch<{ success: boolean }>(`/students/${id}/preferences`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
