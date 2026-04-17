import { create } from "zustand";

export type UserRole = "student" | "teacher";

interface AuthState {
  role: UserRole | null;
  id: number | null;
  name: string;
  isAuthenticated: boolean;
  login: (role: UserRole, id: number, name: string) => void;
  logout: () => void;
}

function loadFromStorage(): Pick<AuthState, "role" | "id" | "name" | "isAuthenticated"> {
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const data = JSON.parse(raw);
      return { role: data.role, id: data.id, name: data.name, isAuthenticated: true };
    }
  } catch {
    /* empty */
  }
  return { role: null, id: null, name: "", isAuthenticated: false };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromStorage(),
  login: (role, id, name) => {
    localStorage.setItem("auth", JSON.stringify({ role, id, name }));
    set({ role, id, name, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("auth");
    set({ role: null, id: null, name: "", isAuthenticated: false });
  },
}));
