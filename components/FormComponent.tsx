"use client";
import { useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

import type { FeedbackForm } from "@/lib/forms";

export default function FormComponent({ form }: { form: FeedbackForm }) {
  const questions = form.questions ?? [];
  const choiceQuestions = form.choice_questions ?? [];
  const submissionKey = useRef<string | null>(null);
  const [answers, setAnswers] = useState(() => questions.map(() => ""));
  const [choices, setChoices] = useState(() => choiceQuestions.map(() => ""));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      submissionKey.current ??= crypto.randomUUID();
      const payload = {
        name, email,
        answers: questions.map((q, i) => ({ question_id: q.id, answer: answers[i] })),
        choice_answers: choiceQuestions.map((q, i) => ({ choice_question_id: q.id, selected_choices: [choices[i]] })),
      };
      const res = await fetch(`/api/forms/${encodeURIComponent(form.slug)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": submissionKey.current },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Couldn’t send your response. Your answers are still here.");
      setSent(true);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t send your response."); }
    finally { setBusy(false); }
  }

  return <main className="desk desk-narrow">
    {sent ? <section className="state-sheet" role="status"><p className="kicker"><Check size={16} /> Response received</p><h1>Thanks for the note.</h1><p>Your feedback has reached the form owner.</p></section>
      : <form className="paper-panel responder" onSubmit={submit}>
        <header className="page-heading"><p className="kicker"><span className="ink-line" /> Feedback form</p><h1>{form.title}</h1>{form.description && <p>{form.description}</p>}</header>
        <fieldset disabled={busy} className="field-stack">
          {questions.map((q, i) => <label key={q.id ?? i}>{q.question_text}<Textarea required value={answers[i]} placeholder="Your answer" onChange={e => setAnswers(items => items.map((old, j) => i === j ? e.target.value : old))} /></label>)}
          {choiceQuestions.map((q, i) => <fieldset key={q.id ?? i}><legend className="field-label">{q.question_text}</legend>
            {Array.from(new Set(q.choices)).map(option => <label className="choice-row" key={option}><input required type="radio" name={`choice-${i}`} value={option} checked={choices[i] === option} onChange={() => setChoices(items => items.map((old, j) => i === j ? option : old))} />{option}</label>)}
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
