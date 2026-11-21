import { DialogForm, type Answer } from "./Modal";

export interface Reply { id?: string | number; name?: string; email?: string; date?: string; answers: Answer[] }

export function CardComponent({ reply, formatter }: { reply: Reply; formatter: Intl.DateTimeFormat | null }) {
  const name = reply.name || "Anonymous";
  const timestamp = Date.parse(reply.date || "");
  return <article className="paper-panel reply-card"><header><h2>{name}</h2>{reply.email && <p>{reply.email}</p>}
    {Number.isFinite(timestamp) && <time className="mt-2 block text-sm text-muted-foreground" dateTime={reply.date}>
      {formatter ? formatter.format(timestamp) : new Date(timestamp).toISOString().slice(0, 16).replace("T", " ") + " UTC"}
    </time>}
  </header>
    {reply.answers.length > 0 && <div className="reply-excerpt"><p>{reply.answers[0].prompt}</p><blockquote>{reply.answers[0].value || "No answer"}</blockquote></div>}
    <DialogForm answers={reply.answers} name={name} />
  </article>;
}
