export interface ChatInfo {
  id: number;
  name: string;
  course_id: number;
  student_id: number;
  created_at?: string;
}

export interface ChatMessageDTO {
  id: number;
  chat_id: number;
  role: 'human' | 'ai';
  content: string;
  created_at?: string;
}

export interface ChatResponse {
  response: string;
}
