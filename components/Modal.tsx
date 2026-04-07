import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MultipleChoiceQuestion, Question } from "@/dbschema/interfaces";
import { Eye, FileText } from "lucide-react";

export function DialogForm({
  questions,
  choiceQuestions,
}: {
  questions: Question[];
  choiceQuestions: MultipleChoiceQuestion[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Submission Details
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete response data from this submission
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-4">
          {questions?.map((q, index) => (
            <div key={index} className="space-y-2 p-4 rounded-xl bg-background/50 border border-border">
              <Label className="text-sm text-muted-foreground font-medium">
                {q.question_text}
              </Label>
              <p className="text-foreground font-medium text-lg">
                {q.answer || <span className="text-muted-foreground italic">No response</span>}
              </p>
            </div>
          ))}

          {choiceQuestions?.map((cq, index) => (
            <div key={index} className="space-y-2 p-4 rounded-xl bg-background/50 border border-border">
              <Label className="text-sm text-muted-foreground font-medium">
                {cq.question_text}
              </Label>
              <p className="text-foreground font-medium text-lg">
                {cq.selectedChoice || <span className="text-muted-foreground italic">No response</span>}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
