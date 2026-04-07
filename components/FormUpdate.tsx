"use client";
import Loading from "@/app/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Trash2, Plus, Type, ListChecks, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface LocalQuestion {
  question_text: string;
  answer?: string;
}

interface LocalChoiceQuestion {
  question_text: string;
  choices: string[];
  selectedChoice?: string;
}

export const Update = ({ data, slug }: { data: any; slug: string }) => {
  const [question, setQuestion] = useState<LocalQuestion[]>(data.question || []);
  const [choiceQuestion, setChoiceQuestion] = useState<LocalChoiceQuestion[]>(data.choiceQuestion || []);
  const [title, setTitle] = useState(data.title || "");
  const [description, setDescription] = useState(data.description || "");
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const [animationParent] = useAutoAnimate();

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
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

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

    const emptyChoiceQuestion = choiceQuestion.find((cq) => {
      if (!cq.question_text.trim()) return true;
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
        const responseData = await res.json();
        toast.toast({
          title: "Success",
          description: responseData.message,
          variant: "success",
        });
      } else if (res.status === 429) {
        toast.toast({
          title: "Error",
          description: "Too many requests. Please try again later.",
          variant: "warning",
        });
      } else {
        toast.toast({
          title: "Error",
          description: "Failed to update form",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast.toast({
        title: "Error",
        description: "Failed to update form",
        variant: "destructive",
      });
    }
    setPending(false);
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newQuestion = [...question];
    newQuestion[index].question_text = e.target.value;
    setQuestion(newQuestion);
  };

  const handleChoiceQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>, questionIndex: number) => {
    const newChoiceQuestion = [...choiceQuestion];
    newChoiceQuestion[questionIndex].question_text = e.target.value;
    setChoiceQuestion(newChoiceQuestion);
  };

  const handleChoiceQuestionChange = (e: React.ChangeEvent<HTMLInputElement>, questionIndex: number, choiceIndex: number) => {
    const newChoiceQuestion = [...choiceQuestion];
    if (newChoiceQuestion[questionIndex] && newChoiceQuestion[questionIndex].choices) {
      newChoiceQuestion[questionIndex].choices![choiceIndex] = e.target.value;
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
    newChoiceQuestions[questionIndex].choices!.splice(choiceIndex, 1);
    setChoiceQuestion(newChoiceQuestions);
  };

  const handleQuestionDelete = (index: number) => {
    const newQuestions = [...question];
    newQuestions.splice(index, 1);
    setQuestion(newQuestions);
  };

  return (
    <div className="container mx-auto px-6 py-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link 
            href="/dashboard" 
            className="p-3 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Update Your Form
            </h1>
            <p className="text-muted-foreground mt-1">Edit your feedback form details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-6 p-8 rounded-2xl bg-card/50 border border-border">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-3">
                Form Title
              </label>
              <Input
                type="text"
                id="title"
                minLength={5}
                value={title}
                onChange={handleTitleChange}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all text-lg py-6"
                placeholder="Enter form title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-3">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={handleDescriptionChange}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px] text-lg"
                placeholder="What is this form about?"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-card/50 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Type className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Text Questions</h3>
                  <p className="text-sm text-muted-foreground">Open-ended responses</p>
                </div>
              </div>

              <div className="space-y-4" ref={animationParent}>
                {question.map((q, index) => (
                  <div key={index} className="flex items-start gap-3 group/question">
                    <div className="flex-1">
                      <Input
                        type="text"
                        minLength={3}
                        placeholder={`Question ${index + 1}`}
                        value={q.question_text}
                        onChange={(e) => handleQuestionChange(e, index)}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuestionDelete(index)}
                      className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover/question:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {question.length === 0 && (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    No text questions yet
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={addQuestion}
                variant="outline"
                className="w-full mt-4 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="p-8 rounded-2xl bg-card/50 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ListChecks className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Multiple Choice</h3>
                  <p className="text-sm text-muted-foreground">Select from options</p>
                </div>
              </div>

              <div className="space-y-6" ref={animationParent}>
                {choiceQuestion.map((q, questionIndex) => (
                  <div key={questionIndex} className="space-y-3 p-4 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex items-start gap-3 group/choice">
                      <div className="flex-1">
                        <Input
                          type="text"
                          minLength={3}
                          placeholder={`Question ${questionIndex + 1}`}
                          value={q.question_text}
                          onChange={(e) => handleChoiceQuestionTextChange(e, questionIndex)}
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChoiceQuestionDelete(questionIndex)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover/choice:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 pl-4" ref={animationParent}>
                      {q.choices?.map((choice: string, choiceIndex: number) => (
                        <div key={choiceIndex} className="flex items-center gap-3 group/option">
                          <div className="flex-1">
                            <Input
                              type="text"
                              minLength={1}
                              placeholder={`Option ${choiceIndex + 1}`}
                              value={choice}
                              onChange={(e) => handleChoiceQuestionChange(e, questionIndex, choiceIndex)}
                              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleChoiceDelete(questionIndex, choiceIndex)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover/option:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      onClick={() => addChoice(questionIndex)}
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 ml-4"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                ))}

                {choiceQuestion.length === 0 && (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    No multiple choice questions yet
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={addChoiceQuestion}
                variant="outline"
                className="w-full mt-4 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={pending}
              className="px-10 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <Save className="mr-2 w-5 h-5" />
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
