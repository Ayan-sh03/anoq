import type { ChoiceQuestion, Question } from "./FormComponent";
import { DialogForm } from "./Modal";
import { Card, CardContent, CardFooter } from "./ui/card";

interface CardProps {
    name?: string
    email?: string
    comment?: string
    questions: Question[]
    choiceQuesions: ChoiceQuestion[]
}

export async function CardComponent(card: CardProps) {

    return <Card className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-transform duration-300 ease-in-out hover:-translate-y-2">
        <div className="absolute inset-0 bg-gradient-to-br from-[#9333ea] to-[#3b82f6] opacity-10 blur-3xl" />
        <CardContent className="space-y-4 relative z-10">
            <div className="flex items-center space-x-4">
                <div className="mt-3">
                    <h3 className="font-medium">{card.name || "Anonymous"}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {card.email || "anonymous@anonymous.com"}
                    </p>
                </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
                {card.comment}
            </p>

        </CardContent>
        <CardFooter className="flex justify-end relative z-10">
            <DialogForm questions={card.questions} choiceQuestions={card.choiceQuesions} />


        </CardFooter>
    </Card>;
}
