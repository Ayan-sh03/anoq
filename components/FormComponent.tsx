"use client";
import React, { useState } from "react";
import { useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast, useToast } from "./ui/use-toast";
import { ArrowRight, Check, Send, User, Mail } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

interface Question {
  question_text: string;
  answer?: string;
}

interface ChoiceQuestion {
  question_text: string;
  choices: string[];
  selectedChoice?: string;
}

export interface Form {
  id: string;
  title: string;
  description: string;
  question: Question[];
  choiceQuestion: ChoiceQuestion[];
}

interface FormComponentProps {
  data: Form[];
  slug: string;
}

const validateQuestions = (questions: Question[]): void => {
  const errors: string[] = [];

  questions.forEach((question) => {
    if (!question.question_text.trim()) {
      errors.push("Question text cannot be empty.");
    }
    if (!question.answer && question.answer !== "") {
      errors.push("Answer is required for this question.");
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
};

const validateChoiceQuestions = (choiceQuestions: ChoiceQuestion[]): void => {
  const errors: string[] = [];

  choiceQuestions.forEach((choiceQuestion) => {
    if (!choiceQuestion.question_text.trim()) {
      errors.push("Question text cannot be empty.");
    }
    if (!choiceQuestion.choices.length) {
      errors.push("Choices cannot be empty.");
    }
    if (!choiceQuestion.selectedChoice) {
      errors.push("A choice must be selected.");
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
};

const FormComponent: React.FC<FormComponentProps> = ({ data, slug }) => {
  const [questionValues, setQuestionValues] = useState<Question[]>([]);
  const [choiceQuestionValues, setChoiceQuestionValues] = useState<ChoiceQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const initialQuestionValues: Question[] = data[0]?.question || [];
    const initialChoiceQuestionValues: ChoiceQuestion[] =
      data[0]?.choiceQuestion.map((question) => ({
        ...question,
        choices: [...new Set(question.choices)],
        selectedChoice: "",
      })) || [];

    setQuestionValues(initialQuestionValues);
    setChoiceQuestionValues(initialChoiceQuestionValues);
  }, [data]);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    setQuestionValues((prevValues) => {
      const updatedValues = [...prevValues];
      updatedValues[index].answer = value || "";
      return updatedValues;
    });
  };

  const handleChoiceQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    questionIndex: number,
    choiceIndex: number
  ) => {
    const { checked } = e.target;
    setChoiceQuestionValues((prevValues) => {
      const updatedValues = [...prevValues];
      const updatedQuestion = { ...updatedValues[questionIndex] };
      updatedQuestion.selectedChoice = checked
        ? updatedQuestion.choices[choiceIndex]
        : "";
      updatedValues[questionIndex] = updatedQuestion;
      return updatedValues;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      validateQuestions(questionValues);
      validateChoiceQuestions(choiceQuestionValues);

      const formData = {
        name,
        email,
        slug,
        question: questionValues,
        choiceQuestion: choiceQuestionValues,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/response`, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message);
      }

      setQuestionValues([]);
      setChoiceQuestionValues([]);
      setName("");
      setEmail("");
      setIsSubmitted(true);

      toast.toast({
        title: "Response Submitted",
        description: "Thank you for your anonymous feedback!",
        variant: "success",
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Validation error:", error);
      toast.toast({
        title: "Invalid Response",
        variant: "warning",
        description: `${error}`,
      });
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-4 animate-slide-up">
            Thank You!
          </h2>
          <p className="text-muted-foreground text-lg animate-slide-up stagger-1">
            Your anonymous feedback has been recorded. Your voice matters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 relative z-10">
      {data.map((form: Form, index: number) => (
        <form
          key={index}
          method="post"
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto p-8 sm:p-10 rounded-2xl bg-card/50 border border-border animate-scale-in"
        >
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {form.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {form.description}
            </p>
          </div>

          <div className="space-y-6 mb-10 p-6 rounded-xl bg-background/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <Label htmlFor="name" className="text-foreground font-medium">
                  Name <span className="text-muted-foreground text-sm">(optional)</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  disabled={isLoading}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground mt-1"
                  placeholder="Your name"
                  onChange={({ target }) => setName(target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email <span className="text-muted-foreground text-sm">(optional)</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  disabled={isLoading}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground mt-1"
                  placeholder="your@email.com"
                  onChange={({ target }) => setEmail(target.value)}
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground italic">
              Your responses are completely anonymous. No identifying information is stored.
            </p>
          </div>

          <div className="space-y-10">
            {form.question.map((question, qIndex) => (
              <div key={qIndex} className="space-y-3">
                <Label className="text-foreground font-medium text-lg" htmlFor={`question_${qIndex}`}>
                  {question.question_text}
                </Label>
                <Input
                  type="text"
                  disabled={isLoading}
                  id={`question_${qIndex}`}
                  name={`question_${qIndex}`}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all text-lg py-6"
                  placeholder="Your answer"
                  onChange={(e) => handleQuestionChange(e, qIndex)}
                  value={questionValues[qIndex]?.answer || ""}
                />
              </div>
            ))}

            {form.choiceQuestion.map((choiceQuestion, cIndex) => (
              <div key={cIndex} className="space-y-4 p-6 rounded-xl bg-background/50 border border-border">
                <Label className="text-foreground font-medium text-lg">
                  {choiceQuestion.question_text}
                </Label>
                <div className="space-y-3">
                  {choiceQuestion.choices.map((choice, choiceIndex) => (
                    <div 
                      key={choiceIndex} 
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => {
                        const syntheticEvent = {
                          target: { checked: true }
                        } as any;
                        handleChoiceQuestionChange(syntheticEvent, cIndex, choiceIndex);
                      }}
                    >
                      <Checkbox
                        className="bg-background border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        disabled={isLoading}
                        id={`choicequestion_${cIndex}_choice_${choiceIndex}`}
                        checked={choiceQuestionValues[cIndex]?.selectedChoice === choice}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const syntheticEvent = {
                              target: { checked: true }
                            } as any;
                            handleChoiceQuestionChange(syntheticEvent, cIndex, choiceIndex);
                          }
                        }}
                      />
                      <Label
                        htmlFor={`choicequestion_${cIndex}_choice_${choiceIndex}`}
                        className="text-foreground cursor-pointer flex-1 group-hover:text-primary transition-colors"
                      >
                        {choice}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Button
              disabled={isLoading}
              type="submit"
              className="px-10 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              {isLoading ? (
                "Submitting..."
              ) : (
                <>
                  Submit Feedback
                  <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
};

export default FormComponent;
