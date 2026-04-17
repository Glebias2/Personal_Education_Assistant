export interface Chat {
  chat_id: number;
  name: string;
  course_id: number;
  course_title?: string;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function formFetch<T>(path: string, data: Record<string, string | number>): Promise<T> {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    fd.append(k, String(v));
  }
  return fetch(path, { method: "POST", body: fd }).then(async (res) => {
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  });
}

export const chatApi = {
  create: (data: { student_id: number; course_id: number; name?: string }) =>
    formFetch<{ chat_id: number; name: string }>("/api/v1/chats", {
      student_id: data.student_id,
      course_id: data.course_id,
      name: data.name ?? "Новый чат",
    }),

  getStudentChats: (studentId: number) =>
    fetch(`/api/v1/students/${studentId}/chats`).then(async (res) => {
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json() as Promise<Chat[]>;
    }),

  sendMessage: (chatId: number, message: string) =>
    formFetch<{ response: string }>(`/api/v1/chats/${chatId}/messages`, {
      message,
    }),

  rename: (chatId: number, name: string) => {
    const fd = new FormData();
    fd.append("name", name);
    return fetch(`/api/v1/chats/${chatId}`, { method: "PATCH", body: fd }).then(
      async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<{ success: boolean; name: string }>;
      }
    );
  },

  delete: (chatId: number) =>
    fetch(`/api/v1/chats/${chatId}`, { method: "DELETE" }).then(async (res) => {
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json() as Promise<{ success: boolean }>;
    }),

  getHistory: (chatId: number) =>
    fetch(`/api/v1/chats/${chatId}/messages`).then(async (res) => {
      if (!res.ok) throw new Error(`${res.status}`);
      const raw: Array<{ role: string; content: string }> = await res.json();
      return raw.map((m) => ({
        role: (m.role === "human" ? "user" : "assistant") as ChatMessage["role"],
        content: m.content,
      }));
    }),
};
