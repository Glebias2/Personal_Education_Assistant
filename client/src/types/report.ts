export interface Report {
  id: number;
  student_id: number;
  course_id: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  url?: string;
  comment?: string;
}

export interface ReportCreate {
  student_id: number;
  course_id: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  url?: string;
  comment?: string;
}

export interface PendingReport {
  student_id: number;
  course_title: string;
  lab_title: string;
  url: string;
}

export interface PendingReportsResponse {
  reports: PendingReport[];
}

export interface ReportFeedback {
  status: string;
  message?: string;
}

export interface ReportAnalysisResponse {
  status: "loaded" | "rejected";
  message?: string;
  id?: number;
}

export interface ReportRecommendation {
  id: number;
  report_id: number;
  type: 'student' | 'teacher';
  text: string;
  quality?: 'good' | 'needs_improvement' | 'poor';
  created_at?: string;
}

export interface ReportFilterParams {
  skip?: number;
  limit?: number;
  status_filter?: string;
  student_id?: number;
  course_id?: number;
}
