import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiGet } from "@/lib/server-api";
import type { User } from "./types";

export async function workspaceUser(): Promise<User | null> {
  if (!(await cookies()).has("access_token")) return null;
  const response = await apiGet("/api/auth/me");
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Couldn’t load your account.");
  return response.json();
}

export async function requireWorkspace(path: string): Promise<User> {
  const user = await workspaceUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return user;
}
