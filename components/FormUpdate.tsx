"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { redirect } from "next/navigation";
import Loading from "@/app/Loading";
import Link from "next/link";

import { Form, MultipleChoiceQuestion, Question } from "@/dbschema/interfaces";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export const Update = ({ data, slug }: { data: Form; slug: string }) => {
  const [question, setQuestion] = useState<Question[]>(data.question || []);
  const [choiceQuestion, setChoiceQuestion] = useState<
    MultipleChoiceQuestion[]
  >(data.choiceQuestion || []);
  const [title, setTitle] = useState(data.title || "");
  const [description, setDescription] = useState(data.description || "");
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const [animationParent] = useAutoAnimate()


  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();

  if (isLoading) return <Loading />;

  if (isAuthenticated) {
    console.log("Logged in user:", user);
  } else {
    redirect("/api/auth/login?post_login_redirect_url=/create");
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    // Validators
    if (!title.trim()) {
      toast.toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      setPending(false);
      return;
    }

    if (!description.trim()) {
      toast.toast({
        title: "Error",
        description: "Please enter a description",
        variant: "destructive",
      });
      setPending(false);
      return;
    }

    if (question.length === 0 && choiceQuestion.length === 0) {
      toast.toast({
        title: "Error",
        description: "Please add at least one question",
        variant: "destructive",
      });
      setPending(false);
      return;
    }

    // Check for empty questions
    const emptyQuestion = question.find((q) => !q.question_text.trim());
    if (emptyQuestion) {
      toast.toast({
        title: "Error",
        description: "Please fill in all question fields",
        variant: "destructive",
      });
      setPending(false);
      return;
    }

    // Check for empty choiceQuestions
    const emptyChoiceQuestion = choiceQuestion.find((cq) => {
      if (!cq.question_text.trim()) {
        return true;
      }
      const emptyChoice = cq.choices?.find((choice) => !choice.trim());
      return emptyChoice !== undefined;
    });

    if (emptyChoiceQuestion) {
      toast.toast({
        title: "Error",
        description: "Please fill in all choice question fields",
        variant: "destructive",
      });
      setPending(false);
      return;
    }

    const form = {
      author: user?.email,
      title: title,
      description: description,
      questions: question,
      choiceQuestions: choiceQuestion,
    };

    try {
      const res = await fetch(`/api/form/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        
        toast.toast({
          title: "Success",
          description: data.message,
          variant: "success",
        });
      } 
      else if (res.status === 429) {
      toast.toast({
        title: "Error",
           description: "Too many requests. Please try again later.",
           variant: "warning",
         });
       }
      else {
        toast.toast({
          title: "Error",
          description: "Failed to Update form",
          variant: "destructive",
        });
      }
      setPending(false);
    } catch (error) {
      toast.toast({
        title: "Error",
        description: "Failed to create form",
        variant: "destructive",
      });
      setPending(false);
    }
    setPending(false);
  };

  const handleQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newQuestion = [...question];
    newQuestion[index].question_text = e.target.value;
    setQuestion(newQuestion);
  };

  const handleChoiceQuestionTextChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    questionIndex: number
  ) => {
    const newChoiceQuestion = [...choiceQuestion];
    newChoiceQuestion[questionIndex].question_text = e.target.value;
    setChoiceQuestion(newChoiceQuestion);
  };

  const handleChoiceQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    questionIndex: number,
    choiceIndex: number
  ) => {
    const newChoiceQuestion = [...choiceQuestion];
    if (
      newChoiceQuestion[questionIndex] &&
      newChoiceQuestion[questionIndex].choices
    ) {
      //@ts-ignore
      newChoiceQuestion[questionIndex].choices[choiceIndex] = e.target.value;
    } else {
      // Handle the case where the question or choices might be undefined
      console.error("Invalid questionIndex or choiceIndex");
    }

    setChoiceQuestion(newChoiceQuestion);
  };

  const addQuestion = () => {
    setQuestion([...question, { question_text: "" }]);
  };

  const addChoiceQuestion = () => {
    setChoiceQuestion([...choiceQuestion, { question_text: "", choices: [] }]);
  };

  const addChoice = (questionIndex: number) => {
    const newChoiceQuestion = [...choiceQuestion];
    newChoiceQuestion[questionIndex].choices?.push("");
    setChoiceQuestion(newChoiceQuestion);
  };

  const handleChoiceQuestionDelete = (questionIndex: number) => {
    const newChoiceQuestions = [...choiceQuestion];
    newChoiceQuestions.splice(questionIndex, 1);
    setChoiceQuestion(newChoiceQuestions);
  };

  const handleChoiceDelete = (questionIndex: number, choiceIndex: number) => {
    const newChoiceQuestions = [...choiceQuestion];
    //@ts-ignore

    newChoiceQuestions[questionIndex].choices.splice(choiceIndex, 1);
    setChoiceQuestion(newChoiceQuestions);
  };

  const handleQuestionDelete = (index: number) => {
    const newQuestions = [...question];
    newQuestions.splice(index, 1);
    setQuestion(newQuestions);
  };

  return (
    <div className="h-screen container flex flex-col gap-20 py-10 items-center">
      <h1 className="text-center text-4xl  text-zinc-600 font-bold ">
        Update Your Form
      </h1>

      <form
        className="flex flex-col gap-2 max-w-4xl justify-center items-center"
        onSubmit={handleSubmit}
      >
        <label htmlFor="title">Title</label>
        <Input
          type="text"
          id="title"
          minLength={5}
          value={title}
          onChange={handleTitleChange}
        />
        <label htmlFor="description">Description</label>
        <Textarea
          id="description"
          value={description}
          onChange={handleDescriptionChange}
        />

        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-2 p-2" ref={animationParent}>
            <label htmlFor="questions">Questions</label>
            {question.map((q, index) => (
              <div key={index} className="flex items-center">
                <Input
                  type="text"
                  minLength={3}
                  name="question_text"
                  placeholder={`Question ${index + 1}`}
                  value={q.question_text}
                  onChange={(e) => handleQuestionChange(e, index)}
                />
                <button
                  type="button"
                  className="ml-2 group"
                  onClick={() => handleQuestionDelete(index)}
                >
                  <Trash2 className="opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            ))}
            <Button disabled={pending} type="button" onClick={addQuestion}>
              Add
            </Button>
          </div>
          <div className="flex flex-col gap-2 p-2" ref={animationParent}>
            <label htmlFor="">Multiple Choice Questions</label>
            {choiceQuestion.map((q, questionIndex) => (
              <div
                key={questionIndex}
                className={`${
                  questionIndex > 0 ? " border-t pt-2 border-zinc-500 " : ""
                }`}
              >
                <div className="flex items-center">
                  <Input
                    type="text"
                    minLength={3}
                    placeholder={`Question ${questionIndex + 1}`}
                    value={q.question_text}
                    onChange={(e) =>
                      handleChoiceQuestionTextChange(e, questionIndex)
                    }
                  />
                  <button
                    type="button"
                    className="ml-2 group"
                    onClick={() => handleChoiceQuestionDelete(questionIndex)}
                  >
                    <Trash2 className="opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4" ref={animationParent}>
                  {q.choices?.map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="flex items-center">
                      <Input
                        type="text"
                        minLength={1}
                        placeholder={`Choice ${choiceIndex + 1}`}
                        value={choice}
                        onChange={(e) =>
                          handleChoiceQuestionChange(
                            e,
                            questionIndex,
                            choiceIndex
                          )
                        }
                      />
                      <button
                        type="button"
                        className="ml-2 group"
                        onClick={() =>
                          handleChoiceDelete(questionIndex, choiceIndex)
                        }
                      >
                        <Trash2 className="opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-1"
                  disabled={pending}
                  type="button"
                  onClick={() => addChoice(questionIndex)}
                >
                  Add Choice
                </Button>
              </div>
            ))}
            <Button
              disabled={pending}
              type="button"
              onClick={addChoiceQuestion}
            >
              Add
            </Button>
          </div>
        </div>
        <Button disabled={pending} type="submit">
          Submit
        </Button>
      </form>
    </div>
  );
};
