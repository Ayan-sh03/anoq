"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { ArrowRight, CheckCircle, Edit3, FileText, Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { ChoiceQuestion, Form, Question } from "./FormComponent";

export const Update = ({ data, slug }: { data: Form; slug: string }) => {
  const [question, setQuestion] = useState<Question[]>(data.questions || []);
  const [choiceQuestion, setChoiceQuestion] = useState<
    ChoiceQuestion[]
  >(data.choiceQuestions || []);
  const [title, setTitle] = useState(data.title || "");
  const [description, setDescription] = useState(data.description || "");
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const [animationParent] = useAutoAnimate()


  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    console.log("Logged in user:", user);
  } else {
    redirect("/login?redirect=/dashboard");
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
      const emptyChoice = cq.choices?.find((choice: string) => !choice.trim());
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
        });
      }
      else if (res.status === 429) {
        toast.toast({
          title: "Error",
          description: "Too many requests. Please try again later.",
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
    //@ts-ignore
    setQuestion([...question, { question_text: "" }]);
  };

  const addChoiceQuestion = () => {
    //@ts-ignore
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
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-200/20 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-blue-200/20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-200/15 blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-6 py-3 shadow-lg mb-6">
            <Edit3 className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Form Editor</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Update Your Form
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Refine your feedback form with updated questions and improved design.
          </p>
        </div>

        {/* Main Form */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                    Form Title
                  </label>
                  <Input
                    type="text"
                    id="title"
                    minLength={5}
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter a compelling title for your form"
                    className="bg-white/80 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Describe what this form is about and why people should fill it out"
                    rows={4}
                    className="bg-white/80 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 text-gray-800 placeholder-gray-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Text Questions */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">T</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Text Questions</h3>
                  </div>
                  <Button
                    type="button"
                    onClick={addQuestion}
                    disabled={pending}
                    className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4" ref={animationParent}>
                  {question.map((q, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="text"
                        minLength={3}
                        name="question_text"
                        placeholder={`Question ${index + 1}`}
                        value={q.question_text}
                        onChange={(e) => handleQuestionChange(e, index)}
                        className="bg-white/80 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                      />
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 group"
                        onClick={() => handleQuestionDelete(index)}
                      >
                        <Trash2 className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>
                    </div>
                  ))}
                  {question.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No text questions yet</p>
                      <p className="text-xs mt-1">Click the + button to add one</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiple Choice Questions */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">MC</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Multiple Choice</h3>
                  </div>
                  <Button
                    type="button"
                    onClick={addChoiceQuestion}
                    disabled={pending}
                    className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6" ref={animationParent}>
                  {choiceQuestion.map((q, questionIndex) => (
                    <div
                      key={questionIndex}
                      className={`p-4 rounded-lg bg-white/40 ${questionIndex > 0 ? "border-t-2 border-gray-200 pt-6" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Input
                          type="text"
                          minLength={3}
                          placeholder={`Question ${questionIndex + 1}`}
                          value={q.question_text}
                          onChange={(e) => handleChoiceQuestionTextChange(e, questionIndex)}
                          className="bg-white/80 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 group"
                          onClick={() => handleChoiceQuestionDelete(questionIndex)}
                        >
                          <Trash2 className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.choices?.map((choice: string, choiceIndex: number) => (
                          <div key={choiceIndex} className="flex items-center gap-2">
                            <Input
                              type="text"
                              minLength={1}
                              placeholder={`Choice ${choiceIndex + 1}`}
                              value={choice}
                              onChange={(e) => handleChoiceQuestionChange(e, questionIndex, choiceIndex)}
                              className="bg-white/80 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                            />
                            <button
                              type="button"
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 group"
                              onClick={() => handleChoiceDelete(questionIndex, choiceIndex)}
                            >
                              <Trash2 className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button
                        disabled={pending}
                        type="button"
                        onClick={() => addChoice(questionIndex)}
                        className="mt-3 rounded-lg border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Choice
                      </Button>
                    </div>
                  ))}
                  {choiceQuestion.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-3 opacity-50">
                        <span className="text-white font-bold text-lg">?</span>
                      </div>
                      <p className="text-sm">No multiple choice questions yet</p>
                      <p className="text-xs mt-1">Click the + button to add one</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="text-center pt-8">
              <Button
                disabled={pending}
                type="submit"
                className="px-12 py-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {pending ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" />
                    Update Form
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                )}
              </Button>

              <p className="text-sm text-gray-500 mt-4">
                Your changes will be saved and immediately visible to users.
              </p>

              {/* Back to Dashboard */}
              <div className="mt-6">
                <Link href="/dashboard">
                  <Button variant="outline" className="rounded-lg border-2 border-indigo-200 text-indigo-700 px-6 font-medium bg-white/90 hover:bg-indigo-50 hover:border-indigo-300 shadow-md hover:shadow-lg transition-all duration-300">
                    <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
