export interface CourseCatalogItem {
  id: number;
  title: string;
  teacher_id: number;
  description?: string;
  difficulty?: string;
  tags?: string[];
  score?: number;
  enrollment_count?: number;
  bayesian_rating?: number;
  tag_match?: number;
}

export interface RecommendedCoursesResponse {
  recommended: CourseCatalogItem[];
  other: CourseCatalogItem[];
  has_recommendations: boolean;
}
