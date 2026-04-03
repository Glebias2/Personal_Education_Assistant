import { API_BASE, fetchJSON } from "./helpers"

export interface ChatInfo {
  chat_id: number
  name: string
  course_id: number
  course_title: string
  created_at: string
}

export interface ChatMessageDTO {
  role: "human" | "ai"
  content: string
}

export async function createChat(studentId: number, courseId: number, name?: string): Promise<{ chat_id: number; name: string }> {
  const form = new FormData()
  form.set("student_id", String(studentId))
  form.set("course_id", String(courseId))
  if (name) form.set("name", name)
  const res = await fetch(`${API_BASE}/api/v1/chats`, { method: "POST", body: form })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getStudentChats(studentId: number): Promise<ChatInfo[]> {
  return fetchJSON<ChatInfo[]>(`/api/v1/students/${studentId}/chats`)
}

export async function getChatMessages(chatId: number): Promise<ChatMessageDTO[]> {
  return fetchJSON<ChatMessageDTO[]>(`/api/v1/chats/${chatId}/messages`)
}

export async function deleteChat(chatId: number): Promise<{ success: boolean }> {
  return fetchJSON<{ success: boolean }>(`/api/v1/chats/${chatId}`, { method: "DELETE" })
}

export async function renameChat(chatId: number, name: string): Promise<{ success: boolean; name: string }> {
  const form = new FormData()
  form.set("name", name)
  const res = await fetch(`${API_BASE}/api/v1/chats/${chatId}`, { method: "PATCH", body: form })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function sendChatMessage(chatId: number, message: string): Promise<{ response: string }> {
  const form = new FormData()
  form.set("message", message)
  const res = await fetch(`${API_BASE}/api/v1/chats/${chatId}/messages`, { method: "POST", body: form })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}
