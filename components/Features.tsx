import { FilePenLine, Link2, Inbox } from "lucide-react";

const steps = [
  { icon: FilePenLine, title: "Make a form", text: "Write your own questions or start with an AI draft based on your product." },
  { icon: Link2, title: "Pass it around", text: "Share one link wherever your team, customers, or community already gather." },
  { icon: Inbox, title: "Read the replies", text: "Open your dashboard to read what came back. People can leave their name off the form." },
];

export default function Features() {
  return (
    <section id="how-it-works" className="workflow" aria-labelledby="workflow-title">
      <div className="wrap">
        <h2 id="workflow-title">How it works<span>.</span></h2>
        <ol className="steps">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <div className="step-heading"><span className="step-index" aria-hidden="true">0{i + 1}</span><Icon size={21} strokeWidth={1.65} /></div>
              <h3>{title}</h3><p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
