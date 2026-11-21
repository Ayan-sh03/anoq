"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Navbar from "./Navbar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Update, useSavedDraft, type Draft } from "./FormUpdate";

type Brief = { description: string; productHuntLink: string };
const emptyBrief: Brief = { description: "", productHuntLink: "" };
const subscribeStorage = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};
const serverSnapshot = () => "";

function readBrief(raw: string): Brief {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.description === "string" && typeof parsed.productHuntLink === "string") return parsed;
  } catch { /* Start with empty fields when no brief has been saved. */ }
  return emptyBrief;
}

export default function AIBuilder({ userId }: { userId: number }) {
  const storageKey = `anoq.ai-brief.${userId}`;
  const saved = useSyncExternalStore(subscribeStorage, () => {
    try { return sessionStorage.getItem(storageKey) ?? ""; } catch { return ""; }
  }, serverSnapshot);
  const [entered, setEntered] = useState<Brief | null>(null);
  const brief = entered ?? readBrief(saved);
  const { description, productHuntLink } = brief;
  const reviewKey = `anoq:ai-review:${userId}`;
  const { draft: savedDraft } = useSavedDraft(reviewKey);
  const [review, setReview] = useState<Draft | null>();
  const draft = review === undefined ? savedDraft : review;
  const [pending, setPending] = useState(false);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  function changeBrief(next: Brief) {
    setEntered(next);
    try {
      if (next.description || next.productHuntLink) sessionStorage.setItem(storageKey, JSON.stringify(next));
      else sessionStorage.removeItem(storageKey);
    } catch { /* The form also works when browser storage is unavailable. */ }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setPending(true); setError(""); setSlug("");
    try {
      const body = { prompt: [description.trim(), productHuntLink.trim()].filter(Boolean).join("\n"), preview_only: true };
      const res = await fetch("/api/forms/ai", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body) });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.title || result.slug) throw new Error(result?.error || "Couldn’t generate a draft. Try again.");
      setReview(result);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t generate your form."); }
    finally { setPending(false); }
  }
  function clearReview() {
    try { sessionStorage.removeItem(reviewKey); } catch { /* Session storage is optional. */ }
    setReview(null);
  }
  if (draft) return <Update data={draft} draftKey={reviewKey} onDiscardDraft={clearReview} onPublishDraft={publishedSlug => {
    changeBrief(emptyBrief);
    clearReview();
    setSlug(publishedSlug);
  }} />;
  return <><Navbar section="Workspace"><Link href="/dashboard" className="nav-link">Dashboard</Link></Navbar>
    <main className="desk desk-narrow">
      <header className="page-heading"><p className="kicker"><span className="ink-line" /> AI form builder</p><h1>Start with a draft.</h1><p>Describe your product or paste its Product Hunt link. Anoq will turn it into a feedback form you can edit.</p></header>
      <form onSubmit={submit} className="editor-layout">
        <div className="paper-panel field-stack"><label>Product description<Textarea rows={4} value={description} onChange={e => changeBrief({ ...brief, description: e.target.value })} disabled={pending} placeholder="What are you building, and what would you like to learn?" /></label>
          <p className="or-rule">or</p>
          <label>Product Hunt link<Input type="url" value={productHuntLink} onChange={e => changeBrief({ ...brief, productHuntLink: e.target.value })} disabled={pending} placeholder="https://www.producthunt.com/posts/…" /></label>
        </div>
        {error && <p role="alert" className="form-error">{error}</p>}
        {slug && <p role="status" className="publish-note">Your form is published. <Link className="inline-link" href={`/${slug}`}>Open your form</Link> · <Link className="inline-link" href={`/form/${slug}`}>Read replies</Link></p>}
        <div className="editor-footer"><Link className="text-link" href="/create">Write my own questions</Link>
          <Button type="submit" disabled={pending || (!description.trim() && !productHuntLink.trim())}>{pending ? "Generating…" : "Generate draft"}{pending ? <Sparkles /> : <ArrowRight />}</Button>
        </div>
      </form>
    </main></>;
}
