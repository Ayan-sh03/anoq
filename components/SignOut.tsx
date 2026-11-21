"use client";
import { useState } from "react";
import { authApi } from "@/lib/auth/api";
import { useToast } from "./ui/use-toast";

export default function SignOut() {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  return <button type="button" className="nav-link" disabled={busy} onClick={async () => {
    setBusy(true);
    try { await authApi.logout(); window.location.replace("/"); }
    catch { toast({ title: "Couldn’t sign out", description: "Try again in a moment.", variant: "destructive" }); }
    finally { setBusy(false); }
  }}>{busy ? "Signing out…" : "Sign out"}</button>;
}
