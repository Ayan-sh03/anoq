import { redirect } from "next/navigation";
import { workspaceUser } from "@/lib/auth/workspace";
import Navbar from "./Navbar";
import { AccountForm } from "./AuthForm";

export default async function AccountScreen({ mode, destination }: { mode: "login" | "register"; destination?: string }) {
  const next = destination && /^(\/create(?:\/ai)?|\/dashboard|\/update\/[\w-]+|\/form\/[\w-]+)$/.test(destination) ? destination : "/dashboard";
  if (await workspaceUser()) redirect(next);
  return <><Navbar section="Account" /><main className="desk account-desk"><AccountForm mode={mode} next={next} /></main></>;
}
