import { ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

export interface Answer { prompt: string; value: string }

export function DialogForm({ answers, name }: { answers: Answer[]; name: string }) {
  return <Dialog><DialogTrigger asChild><Button variant="outline" size="sm">Read response <ArrowUpRight /></Button></DialogTrigger>
    <DialogContent className="sample-dialog"><DialogHeader><p className="kicker"><span className="ink-line" /> Form response</p><DialogTitle className="sheet-title">{name}</DialogTitle><DialogDescription>Answers from this submission.</DialogDescription></DialogHeader>
      <dl className="answers">{answers.map((answer, i) => <div key={i}><dt>{answer.prompt}</dt><dd>{answer.value || "No answer"}</dd></div>)}</dl>
    </DialogContent>
  </Dialog>;
}
