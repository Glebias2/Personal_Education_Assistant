export interface Lab {
  id: number;
  number: number;
  title: string;
  task?: string;
  course_id: number;
}

export interface LabCreate {
  number: number;
  title: string;
  task?: string;
  course_id: number;
}
