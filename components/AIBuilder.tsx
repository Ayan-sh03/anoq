"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Navbar from "./Navbar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

export default function AIBuilder() {
  const [description, setDescription] = useState("");
  const [productHuntLink, setLink] = useState("");
  const [pending, setPending] = useState(false);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setPending(true); setError(""); setSlug("");
    try {
      const body = { prompt: [description.trim(), productHuntLink.trim()].filter(Boolean).join("\n") };
      const res = await fetch("/api/forms/ai", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body) });
      const result = await res.json();
      if (!res.ok || !result.slug) throw new Error(result.error || "Couldn’t generate your form. Try again.");
      setSlug(result.slug);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t generate your form."); }
    finally { setPending(false); }
  }
  return <><Navbar section="Workspace"><Link href="/dashboard" className="nav-link">Dashboard</Link></Navbar>
    <main className="desk desk-narrow">
      <header className="page-heading"><p className="kicker"><span className="ink-line" /> AI form builder</p><h1>Start with a draft.</h1><p>Describe your product or paste its Product Hunt link. Anoq will turn it into a feedback form you can edit.</p></header>
      <form onSubmit={submit} className="editor-layout">
        <div className="paper-panel field-stack"><label>Product description<Textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} disabled={pending} placeholder="What are you building, and what would you like to learn?" /></label>
          <p className="or-rule">or</p>
          <label>Product Hunt link<Input type="url" value={productHuntLink} onChange={e => setLink(e.target.value)} disabled={pending} placeholder="https://www.producthunt.com/posts/…" /></label>
        </div>
        {error && <p role="alert" className="form-error">{error}</p>}
        {slug && <p role="status" className="publish-note">Your form is ready. <Link className="inline-link" href={`/${slug}`}>Open your form</Link></p>}
        <div className="editor-footer"><Link className="text-link" href="/create">Write my own questions</Link>
          <Button type="submit" disabled={pending || (!description.trim() && !productHuntLink.trim())}>{pending ? "Generating…" : "Generate form"}{pending ? <Sparkles /> : <ArrowRight />}</Button>
        </div>
      </form>
    </main></>;
}
