import Link from "next/link";
import { Plus } from "lucide-react";
import { requireWorkspace } from "@/lib/auth/workspace";
import { apiGet } from "@/lib/server-api";
import type { DashboardForm } from "@/lib/forms";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import DashboardForms from "@/components/DashboardForms";

export default async function DashboardPage() {
  await requireWorkspace("/dashboard");
  const response = await apiGet("/api/users/me/forms");
  if (!response.ok) throw new Error("Couldn’t load your forms.");
  const forms: DashboardForm[] = await response.json();

  return (
    <>
      <Navbar section="Workspace">
        <Button variant="ink" asChild size="sm"><Link href="/create"><Plus /> New form</Link></Button>
      </Navbar>
      <main className="desk">
        <header className="page-heading">
          <p className="kicker"><span className="ink-line" /> Dashboard</p>
          <h1>Your feedback forms.</h1>
          <p>Open a form to read its replies or share its link.</p>
        </header>
        <DashboardForms forms={forms} />
      </main>
    </>
  );
}
