import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Responses from "@/components/Responses";
import { Button } from "@/components/ui/button";
import { requireWorkspace } from "@/lib/auth/workspace";
import { getForm } from "@/lib/form-data";
import { apiGet } from "@/lib/server-api";
import type { Submission } from "@/lib/forms";

export default async function SubmissionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireWorkspace(`/form/${slug}`);
  const response = await apiGet(`/api/forms/${encodeURIComponent(slug)}/submissions`);
  if (response.status === 403 || response.status === 404) notFound();
  if (!response.ok) throw new Error("Couldn’t load these responses.");
  const rows: Submission[] = await response.json();
  const form = await getForm(slug);
  const replies = rows.map(row => ({
    id: row.id, name: row.name, email: row.email, date: row.submitted_at,
    answers: [
      ...(row.answers ?? []).map(answer => ({ prompt: answer.question_text, value: answer.answer })),
      ...(row.choice_answers ?? []).map(answer => ({ prompt: answer.question_text, value: answer.selected_choices.join(", ") })),
    ],
  }));

  return (
    <>
      <Navbar section="Workspace"><Link href="/dashboard" className="nav-link">Dashboard</Link></Navbar>
      <main className="desk">
        <header className="page-heading collection-heading">
          <div>
            <p className="kicker"><span className="ink-line" /> Submissions</p>
            <h1>Form responses.</h1>
            <p>{form.title}</p>
          </div>
          <Button asChild variant="outline"><Link href={`/${slug}`}>View form <ArrowUpRight /></Link></Button>
        </header>
        <Responses replies={replies} />
      </main>
    </>
  );
}
