"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

const options = ["Easier setup", "Better search", "More shortcuts"];

export default function SampleBox() {
  const [choice, setChoice] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Dialog onOpenChange={(open) => { if (open) { setChoice(""); setSent(false); } }}>
      <div className="print-stage">
        <div className="photo-print">
          <div className="tape" aria-hidden="true" />
          <Image className="box-photo" src="/suggestion-box.webp" alt="A handwritten note tucked into a vermilion metal suggestion box" width={1200} height={1200} priority sizes="(max-width: 740px) 88vw, 480px" />
          <DialogTrigger asChild>
            <button type="button" className="print-caption"><FileText size={17} /><span>Try a sample form</span><span className="caption-arrow"><ArrowUpRight size={17} /></span></button>
          </DialogTrigger>
        </div>
      </div>
      <DialogContent className="sample-dialog">
        <DialogHeader>
          <p className="kicker"><span className="ink-line" /> Sample form</p>
          <DialogTitle className="sheet-title">{sent ? "Thanks for the note." : "Help shape the next release."}</DialogTitle>
          <DialogDescription>{sent ? "You’ve tried the responder experience. Your sample answer stays in this preview." : "Try answering a question. This preview stays in your browser."}</DialogDescription>
        </DialogHeader>
        {sent ? <Button variant="outline" onClick={() => { setSent(false); setChoice(""); }}>Try again <ArrowRight /></Button> :
          <form onSubmit={(event) => { event.preventDefault(); setSent(true); }} className="sample-form">
            <fieldset><legend>What should we work on next?</legend>
              {options.map(option => <label key={option} className="choice-row">
                <input type="radio" name="sample-choice" value={option} required checked={choice === option} onChange={() => setChoice(option)} />{option}
              </label>)}
            </fieldset>
            <Button type="submit" disabled={!choice}>Send sample answer <Check /></Button>
          </form>
        }
      </DialogContent>
    </Dialog>
  );
}
