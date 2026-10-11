import { api } from "./api";

const TOKEN = "spra-token";
const USER = "spra-user";
const USERS = "spra-users";

export function getUser(): { name: string; email: string; role: string } | null {
  if (typeof window === "undefined" || !localStorage.getItem(TOKEN)) return null;
  return JSON.parse(localStorage.getItem(USER) ?? "null");
}

function fakeJwt(payload: object) {
  const b = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${b({ alg: "HS256", typ: "JWT" })}.${b({ ...payload, exp: Date.now() / 1000 + 86400 })}.demo`;
}

export async function login(email: string, password: string) {
  if (api.enabled) {
    const { access_token } = await api.login(email, password);
    localStorage.setItem(TOKEN, access_token);
    localStorage.setItem(USER, JSON.stringify({ name: email.split("@")[0], email, role: "Faculty" }));
    return;
  }
  const users = JSON.parse(localStorage.getItem(USERS) ?? "[]") as { name: string; email: string; password: string; role: string }[];
  const u = users.find((x) => x.email === email && x.password === password);
  if (!u) throw new Error("Invalid email or password");
  localStorage.setItem(TOKEN, fakeJwt({ sub: email, role: u.role }));
  localStorage.setItem(USER, JSON.stringify({ name: u.name, email, role: u.role }));
}

export async function signup(body: { name: string; email: string; password: string; role: string }) {
  if (api.enabled) { await api.signup(body); return login(body.email, body.password); }
  const users = JSON.parse(localStorage.getItem(USERS) ?? "[]");
  if (users.some((u: { email: string }) => u.email === body.email)) throw new Error("An account with this email already exists");
  users.push(body);
  localStorage.setItem(USERS, JSON.stringify(users));
  return login(body.email, body.password);
}

export function logout() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(USER);
}
