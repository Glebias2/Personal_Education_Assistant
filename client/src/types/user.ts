export type UserRole = 'student' | 'teacher';

export interface AuthUser {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface Student {
  id: number;
  login: string;
  password?: string;
  telegram_id?: number;
  first_name: string;
  last_name: string;
  characteristic?: string;
}

export interface StudentCreate {
  login: string;
  password: string;
  telegram_id?: number;
  first_name: string;
  last_name: string;
  characteristic?: string;
}

export interface Teacher {
  first_name: string;
  last_name: string;
}

export interface TeacherAuth {
  success: boolean;
  teacher_id: number;
}

export interface TeacherCreate {
  login: string;
  password: string;
  telegram_id?: number;
  first_name: string;
  last_name: string;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}
