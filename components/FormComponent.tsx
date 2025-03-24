"use client";
import React, { useState } from "react";
import { useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { poppins } from "@/app/fonts";
import { toast, useToast } from "./ui/use-toast";
import { ArrowRight } from "lucide-react";
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
    // Check if question_text is not empty
    if (!question.question_text.trim()) {
      errors.push("Question text cannot be empty.");
    }

    // Check if answer is provided if required
    if (!question.answer && question.answer !== "") {
      errors.push("Answer is required for this question.");
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
};

// Validate choiceQuestionValues
const validateChoiceQuestions = (choiceQuestions: ChoiceQuestion[]): void => {
  const errors: string[] = [];

  choiceQuestions.forEach((choiceQuestion) => {
    // Check if question_text is not empty
    if (!choiceQuestion.question_text.trim()) {
      errors.push("Question text cannot be empty.");
    }

    // Check if choices array is not empty
    if (!choiceQuestion.choices.length) {
      errors.push("Choices cannot be empty.");
    }

    // Check if a choice is selected
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
  const [choiceQuestionValues, setChoiceQuestionValues] = useState<
    ChoiceQuestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const toast = useToast();

  useEffect(() => {
    //check if user already submitted

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

  const handleQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
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
      // Validate questionValues
      validateQuestions(questionValues);

      // Validate choiceQuestionValues
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setQuestionValues([]);
      setChoiceQuestionValues([]);
      setName("");
      setEmail("");

      toast.toast({
        title: "Your Response has been recorded",
        duration: 3000,
        description: "Thank you for submitting your response",
        variant: "success",
      });
      setIsLoading(false);
    } catch (error) {
      // Handle validation errors and display a toast or notification
      console.error("Validation error:", error);
      // Display toast or notification with error message
      toast.toast({
        title: "Invalid Response",
        variant: "warning",
        description: `${error}`,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-900 to-indigo-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-indigo-600 blur-[120px] animate-pulse delay-300"></div>
      </div>

      {/* Form Container */}
      <div className="container mx-auto px-6 py-8 relative z-10">
        {data.map((form: Form, index: number) => (
          <form
            key={index}
            method="post"
            onSubmit={handleSubmit}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-3xl mx-auto"
          >
            {/* Form Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                {form.title}
              </h1>
              <p className="text-gray-300 text-lg">{form.description}</p>
            </div>

            {/* Personal Info */}
            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <Label className="text-gray-300" htmlFor="name">
                  Name
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  disabled={isLoading}
                  className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400"
                  placeholder="Your name"
                  onChange={({ target }) => setName(target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300" htmlFor="email">
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  disabled={isLoading}
                  className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400"
                  placeholder="Your email"
                  onChange={({ target }) => setEmail(target.value)}
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-8">
              {form.question.map((question, qIndex) => (
                <div key={qIndex} className="space-y-2">
                  <Label className="text-gray-300" htmlFor={`question_${qIndex}`}>
                    {question.question_text}
                  </Label>
                  <Input
                    type="text"
                    disabled={isLoading}
                    id={`question_${qIndex}`}
                    name={`question_${qIndex}`}
                    className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400"
                    placeholder="Your answer"
                    onChange={(e) => handleQuestionChange(e, qIndex)}
                    value={questionValues[qIndex]?.answer || ""}
                  />
                </div>
              ))}

              {/* Choice Questions */}
              {form.choiceQuestion.map((choiceQuestion, cIndex) => (
                <div key={cIndex} className="space-y-3">
                  <Label className="text-gray-300">
                    {choiceQuestion.question_text}
                  </Label>
                  <div className="space-y-2 pl-2">
                    {choiceQuestion.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} className="flex items-center gap-3">
                        <Checkbox
                          className="bg-white data-[state=checked]:bg-white"
                          disabled={isLoading}
                          id={`choicequestion_${cIndex}_choice_${choiceIndex}`}
                          onCheckedChange={(checked) => {
                            handleChoiceQuestionChange(
                              { target: { checked } } as any,
                              cIndex,
                              choiceIndex
                            );
                          }}
                          checked={choiceQuestionValues[cIndex]?.selectedChoice === choice}
                        />
                        <Label
                          htmlFor={`choicequestion_${cIndex}_choice_${choiceIndex}`}
                          className="text-gray-300"
                        >
                          {choice}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="mt-10 flex justify-center">
              <Button
                disabled={isLoading}
                type="submit"
                className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-purple-600/40 transition-all transform hover:scale-105 group"
              >
                {isLoading ? "Submitting..." : "Submit Feedback"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </form>
        ))}
      </div>

      {/* Floating Animated Shapes */}
      <div className="absolute top-20 right-20 w-16 h-16 rounded-full bg-purple-500/30 blur-xl animate-float"></div>
      <div className="absolute bottom-40 left-20 w-24 h-24 rounded-full bg-pink-500/30 blur-xl animate-float-delay"></div>
    </div>
  );
};

export default FormComponent;
