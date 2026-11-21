import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Download, QrCode } from "lucide-react";
import Navbar from "@/components/Navbar";
import Responses from "@/components/Responses";
import { Button } from "@/components/ui/button";
import { requireWorkspace } from "@/lib/auth/workspace";
import { apiGet } from "@/lib/server-api";
import type { FormReport, Submission } from "@/lib/forms";
import ChoiceResults from "@/components/ChoiceResults";

export default async function SubmissionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireWorkspace(`/form/${slug}`);
  const base = `/api/forms/${encodeURIComponent(slug)}` as const;
  const [summary, submissions] = await Promise.all([apiGet(`${base}/report`), apiGet(`${base}/submissions`)]);
  if ([summary.status, submissions.status].some(status => status === 403 || status === 404)) notFound();
  if (!summary.ok || !submissions.ok) throw new Error("Couldn’t load these responses.");
  const report: FormReport = await summary.json();
  const rows: Submission[] = await submissions.json();
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
            <p className="kicker"><span className="ink-line" /> Response report</p>
            <h1>{report.title}</h1>
            <p>{report.response_count} {report.response_count === 1 ? "response" : "responses"} · {report.status === "open" ? "Collection open" : "Collection closed"}</p>
          </div>
          <div className="report-actions">
            <Button asChild variant="ink" size="sm"><a href={`${base}/responses.csv`} download><Download /> Export CSV</a></Button>
            {report.status === "open" && <Button asChild variant="outline" size="sm"><Link href={`/event/${slug}`}><QrCode /> Show event QR</Link></Button>}
            <Link className="text-link" href={`/${slug}`}>View form <ArrowUpRight size={15} /></Link>
          </div>
        </header>
        <ChoiceResults questions={report.choice_questions} />
        <section aria-labelledby="individual-responses">
          <h2 id="individual-responses" className="sheet-title report-section-title">Individual responses</h2>
          <Responses replies={replies} />
        </section>
      </main>
    </>
  );
}
