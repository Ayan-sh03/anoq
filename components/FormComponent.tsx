"use client";
import React, { useState } from "react";
import { useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { poppins } from "@/app/fonts";
import { toast, useToast } from "./ui/use-toast";

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
    <div
      className={`container ${poppins.className} py-3 xl:px-16 max-h-screen overflow-scroll`}
    >
      {data.map((form: Form, index: number) => (
        <form key={index} method="post" onSubmit={handleSubmit}>
          <h1 className="text-3xl text-balance md:text-5xl my-3 font-semibold text-center ">
            {form.title}
          </h1>
          <p className="text-xl  ">{form.description}</p>

          <Label
            className="text-lg sm:text-md font-semibold first-letter:capitalize"
            htmlFor="name"
          >
            Name
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            disabled={isLoading}
            placeholder="Your name"
            onChange={({ target }) => setName(target.value)}
          />

          <Label
            className="text-lg sm:text-md font-semibold first-letter:capitalize"
            htmlFor="email"
          >
            Email
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            disabled={isLoading}
            placeholder="Your email"
            onChange={({ target }) => setEmail(target.value)}
          />

          {form.question.map((question, qIndex) => (
            <div key={qIndex} className="flex flex-col gap-2 my-3">
              <Label
                className="text-lg sm:text-md font-semibold first-letter:capitalize"
                htmlFor={`question_${qIndex}`}
              >
                {question.question_text}
              </Label>
              <Input
                type="text"
                disabled={isLoading}
                id={`question_${qIndex}`}
                name={`question_${qIndex}`}
                placeholder="Your answer"
                onChange={(e) => handleQuestionChange(e, qIndex)}
                value={questionValues[qIndex]?.answer || ""}
              />
            </div>
          ))}
          {form.choiceQuestion.map((choiceQuestion, cIndex) => (
            <div key={cIndex} className="my-3">
              <Label className="text-lg sm:text-md font-semibold">
                {choiceQuestion.question_text}
              </Label>
              {choiceQuestion.choices.map((choice, choiceIndex) => (
                <div
                  key={choiceIndex}
                  className="flex flex-row gap-2 my-3 items-center "
                >
                  <Input
                    type="checkbox"
                    className="size-5"
                    disabled={isLoading}
                    id={`choicequestion_${cIndex}_choice_${choiceIndex}`}
                    name={`choicequestion_${cIndex}`}
                    value={choice}
                    onChange={(e) =>
                      handleChoiceQuestionChange(e, cIndex, choiceIndex)
                    }
                    checked={
                      choiceQuestionValues[cIndex]?.selectedChoice === choice
                    }
                  />
                  <Label
                    htmlFor={`choicequestion_${cIndex}_choice_${choiceIndex}`}
                  >
                    {choice}
                  </Label>
                </div>
              ))}
            </div>
          ))}
          <Button disabled={isLoading} type="submit">
            Submit
          </Button>
        </form>
      ))}
    </div>
  );
};

export default FormComponent;
