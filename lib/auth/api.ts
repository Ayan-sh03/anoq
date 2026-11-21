import type { LoginCredentials, RegisterData } from "./types";

async function updateSession(endpoint: string, body?: LoginCredentials | RegisterData) {
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || "Couldn’t complete this request. Please try again.");
  }
}

export const authApi = {
  login: (credentials: LoginCredentials) => updateSession("/api/auth/login", credentials),
  register: (details: RegisterData) => updateSession("/api/auth/register", details),
  logout: () => updateSession("/api/auth/logout"),
};
