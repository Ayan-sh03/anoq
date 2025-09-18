"use client";
import React, { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { poppins } from "@/app/fonts";
import { toast, useToast } from "./ui/use-toast";

export interface Question {
  id: string;
  question_text: string;
  answer?: string;
}

export interface ChoiceQuestion {
  id: string;
  question_text: string;
  choices: string[];
  selectedChoice?: string;
}

export interface Form {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  choiceQuestions: ChoiceQuestion[];
  submissionCount: number;
  lastSubmission: string | null;
}

interface FormComponentProps {
  data: Form;
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
  const router = useRouter();
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

    const initialQuestionValues: Question[] = data.questions || [];
    const initialChoiceQuestionValues: ChoiceQuestion[] =
      data.choiceQuestions?.map((question) => ({
        ...question,
        choices: [...new Set(question.choices)],
        selectedChoice: "",
      })) || [];

    setQuestionValues(initialQuestionValues);
    setChoiceQuestionValues(initialChoiceQuestionValues);


  }, [data]);

  const handleQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
        answers: questionValues.map((q, index) => ({
          question_id: q.id, // Backend expects question ID, assuming 1-based indexing
          answer: q.answer || ""
        })),
        choice_answers: choiceQuestionValues.map((q, index) => ({
          choice_question_id: q.id, // Backend expects choice question ID
          selected_choices: q.selectedChoice ? [q.selectedChoice] : []
        }))
      };

      const res = await fetch(`/api/forms/${slug}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to submit form");
      }

      setQuestionValues([]);
      setChoiceQuestionValues([]);
      setName("");
      setEmail("");

      toast.toast({
        title: "Your Response has been recorded",
        duration: 3000,
        description: "Thank you for submitting your response",
      });

      // Navigate to thank you page after successful submission
      setTimeout(() => {
        router.push('/thank-you');
      }, 1500); // Wait 1.5 seconds for toast to show before navigating

      setIsLoading(false);
    } catch (error) {
      // Handle validation errors and display a toast or notification
      console.error("Validation error:", error);
      // Display toast or notification with error message
      toast.toast({
        title: "Invalid Response",
        description: `${error}`,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <form key={data.id} method="post" onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Info Section with clean design */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-white/20">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                Your Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="name">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Full Name
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    disabled={isLoading}
                    placeholder="Enter your full name"
                    onChange={({ target }) => setName(target.value)}
                    className="bg-white/80 border-2 border-gray-200 rounded-lg px-4 py-3 text-lg focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 hover:border-indigo-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="email">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    disabled={isLoading}
                    placeholder="your.email@example.com"
                    onChange={({ target }) => setEmail(target.value)}
                    className="bg-white/80 border-2 border-gray-200 rounded-lg px-4 py-3 text-lg focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 hover:border-indigo-300"
                  />
                </div>
              </div>
            </div>

            {/* Questions Section with enhanced styling */}
            {data.questions?.map((question, qIndex) => (
              <div key={qIndex} className="bg-white/60 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {qIndex + 2}
                  </div>
                  <div className="flex-1 space-y-4">
                    <Label
                      className="text-xl font-bold text-gray-800 leading-relaxed"
                      htmlFor={`question_${qIndex}`}
                    >
                      {question.question_text}
                    </Label>
                    <div className="relative">
                      <textarea
                        disabled={isLoading}
                        id={`question_${qIndex}`}
                        name={`question_${qIndex}`}
                        placeholder="Share your thoughts here..."
                        onChange={(e) => handleQuestionChange(e, qIndex)}
                        value={questionValues[qIndex]?.answer || ""}
                        className="w-full bg-white/80 border-2 border-gray-200 rounded-lg px-4 py-4 text-lg focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 hover:border-indigo-300 resize-none min-h-[120px]"
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {questionValues[qIndex]?.answer?.length || 0}/500
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Choice Questions with enhanced styling */}
            {data.choiceQuestions?.map((choiceQuestion, cIndex) => (
              <div key={cIndex} className="bg-white/60 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {cIndex + data.questions.length + 2}
                  </div>
                  <div className="flex-1">
                    <Label className="text-xl font-bold text-gray-800 mb-6 block">
                      {choiceQuestion.question_text}
                    </Label>
                    <div className="space-y-3">
                      {choiceQuestion.choices.map((choice, choiceIndex) => (
                        <label
                          key={choiceIndex}
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${choiceQuestionValues[cIndex]?.selectedChoice === choice
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 bg-white/50 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                        >
                          <div className="relative">
                            <Input
                              type="radio"
                              className="w-5 h-5 text-indigo-600 border-2 border-gray-300 focus:ring-indigo-500 focus:ring-2"
                              disabled={isLoading}
                              id={`choicequestion_${cIndex}_choice_${choiceIndex}`}
                              name={`choicequestion_${cIndex}`}
                              value={choice}
                              onChange={(e) => handleChoiceQuestionChange(e, cIndex, choiceIndex)}
                              checked={choiceQuestionValues[cIndex]?.selectedChoice === choice}
                            />
                            {choiceQuestionValues[cIndex]?.selectedChoice === choice && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <span className="text-gray-700 font-medium flex-1">{choice}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Submit Section with enhanced styling */}
            <div className="text-center pt-8">
              <Button
                disabled={isLoading}
                type="submit"
                className="px-12 py-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Feedback
                  </div>
                )}
              </Button>

              <p className="text-sm text-gray-500 mt-4">
                By submitting, you agree to our privacy policy and confirm this is anonymous feedback.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormComponent;
