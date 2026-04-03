export interface Course {
  id: number;
  title: string;
  teacher_id: number;
  exam_questions?: string;
  vector_storage_id?: string;
}

export interface CourseCreate {
  title: string;
  teacher_id: number;
  exam_questions?: string;
  vector_storage_id?: string;
}

/** Краткая информация о курсе (GET /api/v1/teachers/{id}/courses) */
export interface CourseShort {
  id: number;
  title: string;
}

export interface CourseStudent {
  id: number;
  first_name: string;
  last_name: string;
}

export interface CourseStudentsResponse {
  students: CourseStudent[];
}
