"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

import type { FeedbackForm } from "@/lib/forms";

export default function FormComponent({ form }: { form: FeedbackForm }) {
  const questions = form.questions ?? [];
  const choiceQuestions = form.choice_questions ?? [];
  const formRef = useRef<HTMLFormElement>(null);
  const submissionKey = useRef<string | null>(null);
  const draftKey = `anoq:response-draft:${form.slug}`;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<"new" | "prior" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = formRef.current;
    if (!element) return;
    try {
      const stored = sessionStorage.getItem(draftKey);
      if (!stored) return;
      const draft = JSON.parse(stored);
      if (typeof draft?.submissionKey === "string") submissionKey.current = draft.submissionKey;
      for (const input of Array.from(element.elements)) {
        if (input instanceof HTMLTextAreaElement) {
          const value = draft.answers?.[input.name];
          if (!input.value && typeof value === "string") input.value = value;
        } else if (input instanceof HTMLInputElement && input.type === "radio" && draft.answers?.[input.name] === input.value) {
          input.checked = true;
        }
      }
    } catch { /* Browsers can disable session storage. The form still works. */ }
  }, [draftKey]);

  function saveDraft(data: FormData) {
    const answers: Record<string, string> = {};
    for (const [key, value] of data.entries()) {
      if (/^(written|choice)-\d+$/.test(key) && typeof value === "string" && value) answers[key] = value;
    }
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ answers, submissionKey: submissionKey.current }));
    } catch { /* Keep the live form usable if storage is unavailable. */ }
  }

  function finish(receipt: "new" | "prior") {
    try { sessionStorage.removeItem(draftKey); } catch { /* Storage can be disabled. */ }
    setSent(receipt);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const element = event.currentTarget;
    const data = new FormData(element);
    for (const field of element.querySelectorAll("textarea")) {
      if (!field.value.trim()) {
        field.setCustomValidity("Please write an answer before sending.");
        field.reportValidity();
        return;
      }
    }
    setBusy(true);
    setError("");
    const endpoint = `/api/forms/${encodeURIComponent(form.slug)}`;
    try {
      submissionKey.current ??= crypto.randomUUID();
      saveDraft(data);
      const payload = {
        name, email,
        answers: questions.map(q => ({ question_id: q.id, answer: data.get(`written-${q.id}`) })),
        choice_answers: choiceQuestions.map(q => ({ choice_question_id: q.id, selected_choices: [data.get(`choice-${q.id}`)] })),
      };
      const response = await fetch(`${endpoint}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": submissionKey.current },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        finish("new");
        return;
      }
      const body = await response.json().catch(() => null);
      if (response.status === 409) {
        const receipt = await fetch(`${endpoint}/submitted`, { cache: "no-store" });
        if (receipt.ok && (await receipt.json()).submitted) {
          finish("prior");
          return;
        }
      }
      const safeDetails = response.status >= 400 && response.status < 500 && typeof body?.error === "string";
      setError(safeDetails ? body.error : "We couldn’t send your response. Your answers are still here. Please try again.");
    } catch {
      setError("Couldn’t reach the form. Check your connection and try again. Your answers are still here.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="desk desk-narrow">
    {sent ? <section className="state-sheet" role="status"><p className="kicker"><Check size={16} /> Response received</p><h1>{sent === "prior" ? "Your note is in." : "Thanks for the note."}</h1><p>{sent === "prior" ? "You already sent feedback from this browser." : "Your feedback has reached the form owner."}</p></section>
      : <form ref={formRef} method="post" className="paper-panel responder" onSubmit={submit} onChange={event => saveDraft(new FormData(event.currentTarget))}>
        <header className="page-heading"><p className="kicker"><span className="ink-line" /> Feedback form</p><h1>{form.title}</h1>{form.description && <p>{form.description}</p>}</header>
        <fieldset disabled={busy} className="field-stack">
          {questions.map(q => <label key={q.id}>{q.question_text}<Textarea required name={`written-${q.id}`} placeholder="Your answer" onInput={event => event.currentTarget.setCustomValidity("")} /></label>)}
          {choiceQuestions.map(q => <fieldset key={q.id}><legend className="field-label">{q.question_text}</legend>
            {Array.from(new Set(q.choices)).map(option => <label className="choice-row" key={option}><input required type="radio" name={`choice-${q.id}`} value={option} />{option}</label>)}
          </fieldset>)}
          <details className="details-block"><summary>Add contact details <span>(optional)</span></summary><p className="panel-note">Only include these if you want the form owner to know who responded.</p><div className="field-stack">
            <label>Name<Input autoComplete="name" value={name} onChange={e => setName(e.target.value)} /></label>
            <label>Email<Input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
          </div></details>
        </fieldset>
        {error && <p role="alert" className="form-error">{error}</p>}
        <Button type="submit" disabled={busy} className="mt-6">{busy ? "Sending…" : "Send feedback"} <ArrowRight /></Button>
      </form>}
  </main>;
}
