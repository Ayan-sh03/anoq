"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Trash2, Plus, ArrowRight, ChevronRight } from "lucide-react";
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
  const { toast } = useToast();
  const [animationParent] = useAutoAnimate();
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) redirect("/api/auth/login?post_login_redirect_url=/dashboard");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    // Validation logic remains the same
    if (!title.trim()) {
      toast({ title: "Error", description: "Please enter a title", variant: "destructive" });
      setPending(false);
      return;
    }

    // ... rest of your validation logic

    try {
      const res = await fetch("/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: user?.email,
          title,
          description,
          questions: question,
          choiceQuestions: choiceQuestion,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Success",
          description: (
            <div className="flex items-center">
              <span>{data.message}</span>
              <Link
                href={`/${data.slug}`}
                className="ml-2 text-purple-300 hover:text-purple-200 flex items-center"
              >
                View form <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ),
          variant: "success",
        });
        setTitle("");
        setDescription("");
        setQuestion([]);
        setChoiceQuestion([]);
      } else {
        toast({ title: "Error", description: "Failed to create form", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create form", variant: "destructive" });
    } finally {
      setPending(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-900 to-indigo-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-indigo-600 blur-[120px] animate-pulse delay-300"></div>
      </div>

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex items-center z-10 relative">
        <Link href="/" className="font-bold text-3xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300 hover:from-pink-300 hover:to-purple-400 transition-all">
          Anoq
        </Link>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Create Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">Feedback Form</span>
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Design a form to collect completely anonymous feedback from your users
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Form Title & Description */}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Form Title
                </label>
                <Input
                  type="text"
                  id="title"
                  minLength={5}
                  value={title}
                  onChange={handleTitleChange}
                  className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter form title"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={handleDescriptionChange}
                  className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
                  placeholder="What is this form about?"
                />
              </div>
            </div>

            {/* Questions Sections */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Text Questions */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Text Questions</h3>
                  <Button
                    type="button"
                    onClick={addQuestion}
                    size="sm"
                    variant="ghost"
                    className="text-purple-400 hover:text-purple-300 hover:bg-white/5"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="space-y-4" ref={animationParent}>
                  {question.map((q, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-1">
                        <Input
                          type="text"
                          minLength={3}
                          placeholder={`Question ${index + 1}`}
                          value={q.question_text}
                          onChange={(e) => handleQuestionChange(e, index)}
                          className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuestionDelete(index)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {question.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No text questions added yet</p>
                  )}
                </div>
              </div>

              {/* Multiple Choice Questions */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Multiple Choice</h3>
                  <Button
                    type="button"
                    onClick={addChoiceQuestion}
                    size="sm"
                    variant="ghost"
                    className="text-purple-400 hover:text-purple-300 hover:bg-white/5"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="space-y-6" ref={animationParent}>
                  {choiceQuestion.map((q, questionIndex) => (
                    <div key={questionIndex} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <Input
                            type="text"
                            minLength={3}
                            placeholder={`Question ${questionIndex + 1}`}
                            value={q.question_text}
                            onChange={(e) => handleChoiceQuestionTextChange(e, questionIndex)}
                            className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChoiceQuestionDelete(questionIndex)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 pl-4" ref={animationParent}>
                        {q.choices?.map((choice, choiceIndex) => (
                          <div key={choiceIndex} className="flex items-center gap-3">
                            <div className="flex-1">
                              <Input
                                type="text"
                                minLength={1}
                                placeholder={`Option ${choiceIndex + 1}`}
                                value={choice}
                                onChange={(e) => handleChoiceQuestionChange(e, questionIndex, choiceIndex)}
                                className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleChoiceDelete(questionIndex, choiceIndex)}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        onClick={() => addChoice(questionIndex)}
                        size="sm"
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300 hover:bg-white/5 ml-4"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Option
                      </Button>
                    </div>
                  ))}

                  {choiceQuestion.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No multiple choice questions added yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-8">
              <Button
                type="submit"
                disabled={pending}
                className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-purple-600/40 transition-all transform hover:scale-105 group"
              >
                {pending ? "Creating..." : "Create Feedback Form"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Floating Animated Shapes */}
      <div className="absolute top-20 right-20 w-16 h-16 rounded-full bg-purple-500/30 blur-xl animate-float"></div>
      <div className="absolute bottom-40 left-20 w-24 h-24 rounded-full bg-pink-500/30 blur-xl animate-float-delay"></div>
    </div>
  );

};

export default Create;