import { Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { MultipleChoiceQuestion, Question } from "@/dbschema/interfaces";
import { DialogForm } from "./Modal";

interface CardProps {
  name?: string;
  email?: string;
  comment?: string;
  questions: Question[];
  choiceQuesions: MultipleChoiceQuestion[];
}

export async function CardComponent(card: CardProps) {
  return (
    <Card className="relative overflow-hidden rounded-2xl bg-card/50 border border-border hover:border-primary/30 transition-all duration-200 group">
      <CardContent className="space-y-4 relative z-10 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-semibold">
              {(card.name || "A")[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                {card.name || "Anonymous"}
              </h3>
              <p className="text-sm text-muted-foreground truncate max-w-[160px]">
                {card.email || "anonymous@anonymous.com"}
              </p>
            </div>
          </div>
        </div>

        {card.questions?.map((q, idx) => (
          <div key={idx} className="pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-1">{q.question_text}</p>
            <p className="text-foreground font-medium">{q.answer || "No response"}</p>
          </div>
        ))}

        {card.choiceQuesions?.map((cq, idx) => (
          <div key={idx} className="pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-1">{cq.question_text}</p>
            <p className="text-foreground font-medium">{cq.selectedChoice || "No response"}</p>
          </div>
        ))}
      </CardContent>
      
      <CardFooter className="flex justify-end relative z-10 p-4 pt-0">
        <DialogForm questions={card.questions} choiceQuestions={card.choiceQuesions} />
      </CardFooter>
    </Card>
  );
}
