"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ListChecks, Plus, Sparkles, Trash2, Type } from "lucide-react";
import Navbar from "./Navbar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";

interface Field { id?: number; question_text: string; choices?: string[] }
interface Draft { title: string; description: string; questions?: Field[]; choice_questions?: Field[] }
interface Props { data?: Draft; slug?: string }

function makeRow(field: Field, choice: boolean, key: string) {
  return {
    key, field, choice,
    options: (field.choices ?? []).map((text, index) => ({ key: `${key}-option-${index}`, text })),
  };
}

function rowsFrom(form?: Draft) {
  return [
    ...(form?.questions ?? []).map(field => makeRow(field, false, `written-${field.id}`)),
    ...(form?.choice_questions ?? []).map(field => makeRow(field, true, `choice-${field.id}`)),
  ];
}

export function Update({ data, slug }: Props) {
  const [title, setTitle] = useState(data?.title ?? "");
  const [description, setDescription] = useState(data?.description ?? "");
  const [rows, setRows] = useState(() => rowsFrom(data));
  const [pending, setPending] = useState(false);
  const [published, setPublished] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const editing = Boolean(slug);

  function changeRow(key: string, update: (row: typeof rows[number]) => typeof rows[number]) {
    setRows(items => items.map(row => row.key === key ? update(row) : row));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!title.trim() || !rows.length) {
      setError("Add a title and at least one question.");
      return;
    }
    if (rows.some(row => !row.field.question_text.trim())) {
      setError("Write a question in each question field.");
      return;
    }
    const questions = rows.filter(row => !row.choice).map(({ field }) => ({
      id: field.id,
      question_text: field.question_text.trim(),
    }));
    const choiceQuestions = rows.filter(row => row.choice).map(row => ({
      id: row.field.id,
      question_text: row.field.question_text.trim(),
      choices: row.options.map(option => option.text.trim()),
    }));
    if (choiceQuestions.some(({ choices }) => !choices.length || choices.includes("") || new Set(choices).size !== choices.length)) {
      setError("Give each multiple-choice question at least one option and use a different label for each option.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(slug ? `/api/forms/${encodeURIComponent(slug)}` : "/api/forms", {
        method: slug ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ title: title.trim(), description: description.trim(), questions, choice_questions: choiceQuestions }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Couldn’t save your form. Your draft is still here.");
      if (!result?.slug) throw new Error("The response didn’t include a form link. Check your dashboard before trying again.");
      if (editing) {
        setTitle(result.title);
        setDescription(result.description);
        setRows(rowsFrom(result));
      } else {
        setPublished(result.slug);
        setTitle("");
        setDescription("");
        setRows([]);
      }
      toast({ title: editing ? "Changes saved" : "Form created", variant: "success" });
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t save your form."); }
    finally { setPending(false); }
  }

  return <>
    <Navbar section="Workspace"><Link href="/dashboard" className="nav-link">Dashboard <ArrowRight size={15} className="ml-2" /></Link></Navbar>
    <main className="desk">
      <header className="page-heading"><p className="kicker"><span className="ink-line" /> Form builder</p>
        <h1>{editing ? "Edit your form." : "Create a feedback form."}</h1>
        <p>{editing ? "Update the questions people see when they open your link." : "Give your form a title, then choose what you’d like to ask."}</p>
      </header>
      {published && <p className="publish-note" role="status">Your form is ready. <Link className="inline-link" href={`/${published}`}>Open your form</Link></p>}
      <form onSubmit={submit}><fieldset className="editor-layout min-w-0" disabled={pending}>
        <section className="paper-panel field-stack" aria-label="Form details">
          <label>Form title<Input value={title} required maxLength={255} onChange={e => setTitle(e.target.value)} placeholder="What should we build next?" /></label>
          <label>Description <span className="font-normal text-muted-foreground">(optional)</span><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people what you’d like feedback on." /></label>
        </section>
        <div className="editor-columns">
          {[false, true].map(choice => {
            const questions = rows.filter(row => row.choice === choice);
            return <section key={String(choice)} className="paper-panel">
              <h2 className="panel-title">{choice ? <ListChecks /> : <Type />}{choice ? "Multiple choice" : "Written answers"}</h2>
              <p className="panel-note">{choice ? "Give people options to choose from." : "Let people answer in their own words."}</p>
              {questions.map((row, i) => <div className="editor-item" key={row.key}>
                <label htmlFor={`q-${row.key}`}>Question {i + 1}</label>
                <div className="editor-row"><Input required id={`q-${row.key}`} value={row.field.question_text} onChange={e => changeRow(row.key, old => ({ ...old, field: { ...old.field, question_text: e.target.value } }))} />
                  <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${choice ? "multiple choice" : "written"} question ${i + 1}`} onClick={() => setRows(items => items.filter(item => item.key !== row.key))}><Trash2 /></Button>
                </div>
                {choice && <>{row.options.map((option, j) => <div key={option.key} className="editor-row editor-option">
                  <Input required aria-label={`Question ${i + 1}, option ${j + 1}`} placeholder={`Option ${j + 1}`} value={option.text} onChange={e => changeRow(row.key, old => ({ ...old, options: old.options.map(item => item.key === option.key ? { ...item, text: e.target.value } : item) }))} />
                  <Button size="icon" type="button" variant="ghost" aria-label={`Remove option ${j + 1}`} onClick={() => changeRow(row.key, old => ({ ...old, options: old.options.filter(item => item.key !== option.key) }))}><Trash2 /></Button>
                </div>)}<Button type="button" variant="ghost" size="sm" disabled={row.options.length >= 50} onClick={() => {
                  const option = { key: crypto.randomUUID(), text: "" };
                  changeRow(row.key, old => ({ ...old, options: [...old.options, option] }));
                }}><Plus /> Add option</Button></>}
              </div>)}
              <Button type="button" variant="outline" disabled={rows.length >= 100} aria-label={choice ? "Add multiple choice question" : "Add written question"} onClick={() => {
                const row = makeRow({ question_text: "", ...(choice ? { choices: ["", ""] } : {}) }, choice, crypto.randomUUID());
                setRows(items => [...items, row]);
              }}><Plus /> Add question</Button>
            </section>;
          })}
        </div>
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="editor-footer">
          {editing ? <Link href="/dashboard" className="text-link">Back to dashboard</Link> : <Button asChild variant="ghost"><Link href="/create/ai"><Sparkles /> Build with AI</Link></Button>}
          <Button disabled={pending} type="submit">{pending ? "Saving…" : editing ? "Save changes" : "Create form"} <ArrowRight /></Button>
        </div>
      </fieldset></form>
    </main>
  </>;
}
