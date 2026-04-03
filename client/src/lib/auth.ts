import type { AuthUser, UserRole } from "@/types"

const AUTH_STORAGE_KEY = "paa_auth_user"

export function getAuthUser(): AuthUser | null {
  // NEW FUNCTIONALITY: централизованное хранение авторизации
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setAuthUser(user: AuthUser | null) {
  // NEW FUNCTIONALITY: запись авторизованного пользователя
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

export function logout() {
  // NEW FUNCTIONALITY: выход
  setAuthUser(null)
}

export function loginStudentSimple(id: number): AuthUser {
  // NEW FUNCTIONALITY: legacy вход по ID (оставлено на случай демо)
  const user: AuthUser = {
    id,
    login: String(id),
    first_name: `Студент`,
    last_name: `#${id}`,
    role: "student",
  }
  setAuthUser(user)
  return user
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export async function loginByCredentials(login: string, password: string, role: UserRole = "teacher"): Promise<AuthUser | null> {
  // NEW FUNCTIONALITY: логин через API (teacher/student)
  if (role === "teacher") {
    const auth = await fetchJSON<{ success: boolean; teacher_id: number | null }>(`/teachers/auth`, {
      method: "POST",
      body: JSON.stringify({ login, password }),
    })
    if (!auth.success || !auth.teacher_id) return null
    const info = await fetchJSON<{ first_name: string; last_name: string }>(`/teachers/${auth.teacher_id}`)
    const user: AuthUser = {
      id: auth.teacher_id,
      login,
      first_name: info.first_name,
      last_name: info.last_name,
      role: "teacher",
    }
    setAuthUser(user)
    return user
  }

  const auth = await fetchJSON<{ success: boolean; student_id: number | null }>(`/students/auth`, {
    method: "POST",
    body: JSON.stringify({ login, password }),
  })
  if (!auth.success || !auth.student_id) return null
  const info = await fetchJSON<{ id: number; login: string; first_name: string; last_name: string }>(`/students/${auth.student_id}`)
  const user: AuthUser = {
    id: info.id,
    login: info.login,
    first_name: info.first_name,
    last_name: info.last_name,
    role: "student",
  }
  setAuthUser(user)
  return user
}

export async function registerUser(payload: {
  role: UserRole
  login: string
  password: string
  first_name: string
  last_name: string
  characteristic?: string
  interests?: string[]
}) {
  // NEW FUNCTIONALITY: регистрация через API
  if (payload.role === "teacher") {
    return await fetchJSON<{ success: boolean; teacher_id: number }>(`/teachers/register`, {
      method: "POST",
      body: JSON.stringify({
        login: payload.login,
        password: payload.password,
        first_name: payload.first_name,
        last_name: payload.last_name,
      }),
    })
  }

  return await fetchJSON<{ success: boolean; student_id: number }>(`/students/register`, {
    method: "POST",
    body: JSON.stringify({
      login: payload.login,
      password: payload.password,
      first_name: payload.first_name,
      last_name: payload.last_name,
      characteristic: payload.characteristic,
      interests: payload.interests || [],
    }),
  })
}