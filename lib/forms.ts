export interface FormSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  status: "open" | "closed";
}

export interface Question {
  id: number;
  question_text: string;
}

export interface ChoiceQuestion extends Question {
  choices: string[];
}

export interface FeedbackForm extends FormSummary {
  author_id: number;
  updated_at: string;
  questions?: Question[];
  choice_questions?: ChoiceQuestion[];
}

export interface Submission {
  id: number;
  name?: string;
  email?: string;
  submitted_at: string;
  answers?: { question_text: string; answer: string }[];
  choice_answers?: { question_text: string; selected_choices: string[] }[];
}
