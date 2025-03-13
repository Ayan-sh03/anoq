package models

import "time"

type Form struct {
	ID              int                      `json:"id"`
	Title           string                   `json:"title"`
	Description     string                   `json:"description"`
	Slug            string                   `json:"slug"`
	AuthorID        int                      `json:"author_id"`
	Status          string                   `json:"status"`
	CreatedAt       time.Time                `json:"created_at"`
	UpdatedAt       time.Time                `json:"updated_at"`
	Questions       []Question               `json:"questions,omitempty"`
	ChoiceQuestions []MultipleChoiceQuestion `json:"choice_questions,omitempty"`
}

type FormInput struct {
	Title           string                        `json:"title"`
	Description     string                        `json:"description"`
	Questions       []QuestionInput               `json:"questions"`
	ChoiceQuestions []MultipleChoiceQuestionInput `json:"choice_questions"`
}

type Question struct {
	ID           int       `json:"id"`
	QuestionText string    `json:"question_text"`
	Type         string    `json:"type"`
	CreatedAt    time.Time `json:"created_at"`
}

type QuestionInput struct {
	QuestionText string `json:"question_text"`
}

type MultipleChoiceQuestion struct {
	ID           int       `json:"id"`
	QuestionText string    `json:"question_text"`
	Type         string    `json:"type"`
	Choices      []string  `json:"choices"`
	CreatedAt    time.Time `json:"created_at"`
}

type MultipleChoiceQuestionInput struct {
	QuestionText string   `json:"question_text"`
	Choices      []string `json:"choices"`
}

type FilledForm struct {
	ID            int            `json:"id"`
	FormID        int            `json:"form_id"`
	Name          string         `json:"name"`
	Email         string         `json:"email"`
	UserIP        string         `json:"user_ip"`
	SubmittedAt   time.Time      `json:"submitted_at"`
	Answers       []Answer       `json:"answers,omitempty"`
	ChoiceAnswers []ChoiceAnswer `json:"choice_answers,omitempty"`
}

type FilledFormInput struct {
	Name          string              `json:"name"`
	Email         string              `json:"email"`
	Answers       []AnswerInput       `json:"answers"`
	ChoiceAnswers []ChoiceAnswerInput `json:"choice_answers"`
}

type Answer struct {
	FilledFormID int       `json:"filled_form_id"`
	QuestionID   int       `json:"question_id"`
	Answer       string    `json:"answer"`
	CreatedAt    time.Time `json:"created_at"`
}

type AnswerInput struct {
	QuestionID int    `json:"question_id"`
	Answer     string `json:"answer"`
}

type ChoiceAnswer struct {
	FilledFormID     int       `json:"filled_form_id"`
	ChoiceQuestionID int       `json:"choice_question_id"`
	SelectedChoices  []string  `json:"selected_choices"`
	CreatedAt        time.Time `json:"created_at"`
}

type ChoiceAnswerInput struct {
	ChoiceQuestionID int      `json:"choice_question_id"`
	SelectedChoices  []string `json:"selected_choices"`
}
