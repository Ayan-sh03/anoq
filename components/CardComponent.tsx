import { DialogForm, type Answer } from "./Modal";

export interface Reply { id?: string | number; name?: string; email?: string; date?: string; answers: Answer[] }

export function CardComponent({ reply }: { reply: Reply }) {
  const name = reply.name || "Anonymous";
  return <article className="paper-panel reply-card"><header><h2>{name}</h2>{reply.email && <p>{reply.email}</p>}</header>
    {reply.answers.length > 0 && <div className="reply-excerpt"><p>{reply.answers[0].prompt}</p><blockquote>{reply.answers[0].value || "No answer"}</blockquote></div>}
    <DialogForm answers={reply.answers} name={name} />
  </article>;
}
