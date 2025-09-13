"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useAuth } from "@/lib/auth";
import { Trash2, Plus, FileText, Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
import Loading from "../Loading";

export interface Field {
  question_text: string;
  choices?: string[];
}

const Create = () => {
  const [question, setQuestion] = useState<Field[]>([]);
  const [choiceQuestion, setChoiceQuestion] = useState<Field[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const [textQuestionAnimation] = useAutoAnimate()
  const [choiceQuestionAnimation] = useAutoAnimate()

  const { isAuthenticated, loading, user } = useAuth()

  if (loading) return (<Loading />)

  if (isAuthenticated) {
    console.log("Logged in user:", user);
  }
  else {
    redirect("/login?redirect=/dashboard")
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
      const res = await fetch("/api/form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setQuestion([]);
        setChoiceQuestion([]);
        const data = await res.json()

        toast.toast({
          title: "Success",
          description: data.message || "Form created successfully",
          variant: "success",
          action: (<Link href={`/${data.slug}`}>Visit your form on {process.env.NEXT_PUBLIC_API_URL}/{data.slug}</Link>)
        });

      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create form' }));
        toast.toast({
          title: "Error",
          description: errorData.error || "Failed to create form",
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
    <>
      <Navbar />
      <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 overflow-hidden">
        {/* Background decorative elements - matching landing page theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-200/30 blur-3xl"></div>
          <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg mb-6">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Form Builder</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Create Your Feedback Form
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Design beautiful forms to collect anonymous feedback. Add questions, customize options, and engage your audience.
            </p>
          </div>

          {/* Main Form */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
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
                      className="bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
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
                      className="bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 text-gray-800 placeholder-gray-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Text Questions */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">T</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Text Questions</h3>
                    </div>
                    <Button
                      type="button"
                      onClick={addQuestion}
                      disabled={pending}
                      className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4" ref={textQuestionAnimation}>
                    {question.map((q, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="text"
                          minLength={3}
                          name="question_text"
                          placeholder={`Question ${index + 1}`}
                          value={q.question_text}
                          onChange={(e) => handleQuestionChange(e, index)}
                          className="bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                          onClick={() => handleQuestionDelete(index)}
                        >
                          <Trash2 className="w-5 h-5" />
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
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">MC</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Multiple Choice</h3>
                    </div>
                    <Button
                      type="button"
                      onClick={addChoiceQuestion}
                      disabled={pending}
                      className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-6" ref={choiceQuestionAnimation}>
                    {choiceQuestion.map((q, questionIndex) => (
                      <div
                        key={questionIndex}
                        className={`p-4 rounded-xl bg-gray-50 ${questionIndex > 0 ? "border-t-2 border-gray-200 pt-6" : ""}`}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Input
                            type="text"
                            minLength={3}
                            placeholder={`Question ${questionIndex + 1}`}
                            value={q.question_text}
                            onChange={(e) => handleChoiceQuestionTextChange(e, questionIndex)}
                            className="bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                          />
                          <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                            onClick={() => handleChoiceQuestionDelete(questionIndex)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.choices?.map((choice, choiceIndex) => (
                            <div key={choiceIndex} className="flex items-center gap-2">
                              <Input
                                type="text"
                                minLength={1}
                                placeholder={`Choice ${choiceIndex + 1}`}
                                value={choice}
                                onChange={(e) => handleChoiceQuestionChange(e, questionIndex, choiceIndex)}
                                className="bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                              />
                              <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                onClick={() => handleChoiceDelete(questionIndex, choiceIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <Button
                          type="button"
                          onClick={() => addChoice(questionIndex)}
                          disabled={pending}
                          variant="outline"
                          className="mt-3 rounded-full border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
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

              {/* Submit Button */}
              <div className="text-center">
                <Button
                  disabled={pending}
                  type="submit"
                  className="min-w-[200px] h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 font-semibold text-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 group"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Form
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* AI Alternative */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-md">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-700">Want AI to help you create?</span>
              <Link href="/create/ai">
                <Button variant="link" className="text-indigo-600 hover:text-indigo-700 font-semibold p-0">
                  Try AI Form Builder
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Create;
