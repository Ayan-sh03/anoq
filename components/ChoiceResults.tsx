import type { CSSProperties } from "react";
import type { FormReport } from "@/lib/forms";

export default function ChoiceResults({ questions }: { questions: FormReport["choice_questions"] }) {
  if (!questions.length) return null;
  return <section aria-labelledby="choice-results" className="choice-results">
    <h2 className="sheet-title report-section-title" id="choice-results">Choice totals</h2>
    {questions.map(question => {
      const peak = Math.max(1, ...question.options.map(option => option.count));
      return <article key={JSON.stringify([question.id, question.prompt])} className="choice-result">
        <header><h3>{question.prompt}</h3>{question.previous && <span className="past-question">Earlier version</span>}</header>
        <dl>{question.options.map(option => <div className="choice-stat" key={option.label}
          style={{ "--vote-width": `${option.count / peak * 100}%` } as CSSProperties}>
          <dt>{option.label}</dt><dd>{option.count}</dd>
        </div>)}</dl>
      </article>;
    })}
  </section>;
}
