const BASE = "";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export function apiUpload<T>(path: string, body: FormData): Promise<T> {
  return fetch(path, { method: "POST", body }).then(async (res) => {
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  });
}
