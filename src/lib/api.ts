// FastAPI client. Set VITE_API_URL (e.g. http://localhost:8000) to talk to the Python backend.
const BASE = import.meta.env.VITE_API_URL as string | undefined;

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) throw new Error("VITE_API_URL not configured");
  const token = localStorage.getItem("spra-token");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? res.statusText);
  return res.json();
}

export const api = {
  enabled: !!BASE,
  login: (email: string, password: string) => req<{ access_token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  signup: (body: { name: string; email: string; password: string; role: string }) => req("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  dashboard: (q = "", risk = "") => req(`/api/dashboard?q=${encodeURIComponent(q)}&risk=${encodeURIComponent(risk)}`),
  student: (id: string) => req(`/api/students/${encodeURIComponent(id)}`),
  resolve: (id: string) => req(`/api/students/${encodeURIComponent(id)}/resolve`, { method: "POST" }),
  bulkAttendance: (date: string, records: { student_id: string; status: string }[]) =>
    req("/api/attendance/bulk", { method: "POST", body: JSON.stringify({ date, records }) }),
};
