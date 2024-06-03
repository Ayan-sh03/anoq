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
        <Button variant="outline">More</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submission</DialogTitle>
          <DialogDescription>
            Below is the Submission Details.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 ">
          <div>
            {questions.map((questions, index) => {
              return (
                <div key={index} className="flex flex-col items-start gap-1 ">
                  <Label
                    htmlFor="name"
                    className="text-right text-wrap text-lg first-letter:Capitalize  font-bold"
                  >
                    {questions.question_text}
                  </Label>
                  <p className="text-md">{questions.answer}</p>
                </div>
              );
            })}
          </div>

          <div>
              {choiceQuestions.map((questions, index) => {
                return (
                  <div key={index} className="flex flex-col items-start gap-1 ">
                    <Label
                      htmlFor="name"
                      className="text-right text-wrap text-lg first-letter:Capitalize font-bold"
                    >
                      {questions.question_text}
                    </Label>
                    <p className="text-md">{questions.selectedChoice}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
