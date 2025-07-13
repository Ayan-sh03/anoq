package model

import (
	"time"

	"github.com/google/uuid"
)

// FilledForm represents a form submission
type FilledForm struct {
	ID         uuid.UUID            `json:"id" db:"id"`
	FormID     uuid.UUID            `json:"form_id" db:"form_id"`
	Name       *string              `json:"name,omitempty" db:"name"`
	Email      *string              `json:"email,omitempty" db:"email"`
	UserIP     *string              `json:"user_ip,omitempty" db:"user_ip"`
	CreatedAt  time.Time            `json:"created_at" db:"created_at"`
	ModifiedAt time.Time            `json:"modified_at" db:"modified_at"`
	Answers    []FilledFormQuestion `json:"answers,omitempty"`
	Form       *Form                `json:"form,omitempty"`
}

// FilledFormQuestion represents an answer to a specific question
type FilledFormQuestion struct {
	ID              uuid.UUID       `json:"id" db:"id"`
	FilledFormID    uuid.UUID       `json:"filled_form_id" db:"filled_form_id"`
	QuestionID      uuid.UUID       `json:"question_id" db:"question_id"`
	Answer          *string         `json:"answer,omitempty" db:"answer"`
	SelectedChoices JSONStringArray `json:"selected_choices,omitempty" db:"selected_choices"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
	Question        *Question       `json:"question,omitempty"`
}

// CreateResponseRequest represents the request payload for creating a form response
// @Description Request payload for submitting a form response
type CreateResponseRequest struct {
	FormID  uuid.UUID             `json:"form_id" validate:"required" example:"550e8400-e29b-41d4-a716-446655440002"` // Form ID to submit response for (required)
	Name    *string               `json:"name,omitempty" example:"John Doe"`                                          // Optional respondent name
	Email   *string               `json:"email,omitempty" validate:"omitempty,email" example:"john.doe@example.com"`  // Optional respondent email
	Answers []CreateAnswerRequest `json:"answers" validate:"required,dive"`                                           // List of answers to form questions (required)
}

// CreateAnswerRequest represents the request payload for creating an answer
// @Description Request payload for submitting an answer to a question
type CreateAnswerRequest struct {
	QuestionID      uuid.UUID `json:"question_id" validate:"required" example:"550e8400-e29b-41d4-a716-446655440003"` // Question ID being answered (required)
	Answer          *string   `json:"answer,omitempty" example:"Very satisfied"`                                      // Answer text for basic questions
	SelectedChoices []string  `json:"selected_choices,omitempty" example:"[\"Very satisfied\"]"`                      // Selected choices for multiple_choice questions
}

// UpdateResponseRequest represents the request payload for updating a form response
type UpdateResponseRequest struct {
	Name    *string               `json:"name,omitempty"`
	Email   *string               `json:"email,omitempty" validate:"omitempty,email"`
	Answers []UpdateAnswerRequest `json:"answers,omitempty"`
}

// UpdateAnswerRequest represents the request payload for updating an answer
type UpdateAnswerRequest struct {
	ID              *uuid.UUID `json:"id,omitempty"`
	QuestionID      uuid.UUID  `json:"question_id" validate:"required"`
	Answer          *string    `json:"answer,omitempty"`
	SelectedChoices []string   `json:"selected_choices,omitempty"`
}

// ResponseListResponse represents the response payload for response list
type ResponseListResponse struct {
	ID         uuid.UUID `json:"id"`
	FormID     uuid.UUID `json:"form_id"`
	Name       *string   `json:"name,omitempty"`
	Email      *string   `json:"email,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	ModifiedAt time.Time `json:"modified_at"`
}

// ResponseDetailResponse represents the response payload for detailed response view
type ResponseDetailResponse struct {
	ID         uuid.UUID        `json:"id"`
	FormID     uuid.UUID        `json:"form_id"`
	Name       *string          `json:"name,omitempty"`
	Email      *string          `json:"email,omitempty"`
	UserIP     *string          `json:"user_ip,omitempty"`
	CreatedAt  time.Time        `json:"created_at"`
	ModifiedAt time.Time        `json:"modified_at"`
	Answers    []AnswerResponse `json:"answers"`
	Form       *FormResponse    `json:"form,omitempty"`
}

// AnswerResponse represents the response payload for answer data
type AnswerResponse struct {
	ID              uuid.UUID         `json:"id"`
	QuestionID      uuid.UUID         `json:"question_id"`
	Answer          *string           `json:"answer,omitempty"`
	SelectedChoices []string          `json:"selected_choices,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
	Question        *QuestionResponse `json:"question,omitempty"`
}

// FormSubmissionStats represents statistics for form submissions
type FormSubmissionStats struct {
	FormID           uuid.UUID  `json:"form_id"`
	TotalSubmissions int        `json:"total_submissions"`
	UniqueEmails     int        `json:"unique_emails"`
	AverageTime      float64    `json:"average_completion_time_minutes"`
	LastSubmission   *time.Time `json:"last_submission,omitempty"`
}

// ToResponseList converts a FilledForm to ResponseListResponse
func (f *FilledForm) ToResponseList() *ResponseListResponse {
	return &ResponseListResponse{
		ID:         f.ID,
		FormID:     f.FormID,
		Name:       f.Name,
		Email:      f.Email,
		CreatedAt:  f.CreatedAt,
		ModifiedAt: f.ModifiedAt,
	}
}

// ToDetailResponse converts a FilledForm to ResponseDetailResponse
func (f *FilledForm) ToDetailResponse() *ResponseDetailResponse {
	resp := &ResponseDetailResponse{
		ID:         f.ID,
		FormID:     f.FormID,
		Name:       f.Name,
		Email:      f.Email,
		UserIP:     f.UserIP,
		CreatedAt:  f.CreatedAt,
		ModifiedAt: f.ModifiedAt,
	}

	// Convert answers
	if f.Answers != nil {
		resp.Answers = make([]AnswerResponse, len(f.Answers))
		for i, answer := range f.Answers {
			resp.Answers[i] = *answer.ToResponse()
		}
	}

	// Convert form
	if f.Form != nil {
		resp.Form = f.Form.ToResponse()
	}

	return resp
}

// FromCreateRequest creates a FilledForm from CreateResponseRequest
func (f *FilledForm) FromCreateRequest(req *CreateResponseRequest, userIP string) {
	f.ID = uuid.New()
	f.FormID = req.FormID
	f.Name = req.Name
	f.Email = req.Email
	if userIP != "" {
		f.UserIP = &userIP
	}
	f.CreatedAt = time.Now()
	f.ModifiedAt = time.Now()
}

// UpdateFromRequest updates a FilledForm from UpdateResponseRequest
func (f *FilledForm) UpdateFromRequest(req *UpdateResponseRequest) {
	if req.Name != nil {
		f.Name = req.Name
	}
	if req.Email != nil {
		f.Email = req.Email
	}
	f.ModifiedAt = time.Now()
}

// ToResponse converts a FilledFormQuestion to AnswerResponse
func (q *FilledFormQuestion) ToResponse() *AnswerResponse {
	resp := &AnswerResponse{
		ID:         q.ID,
		QuestionID: q.QuestionID,
		Answer:     q.Answer,
		CreatedAt:  q.CreatedAt,
	}

	// Convert selected choices
	if q.SelectedChoices != nil {
		resp.SelectedChoices = []string(q.SelectedChoices)
	}

	// Convert question
	if q.Question != nil {
		resp.Question = q.Question.ToResponse()
	}

	return resp
}

// FromCreateRequest creates a FilledFormQuestion from CreateAnswerRequest
func (q *FilledFormQuestion) FromCreateRequest(req *CreateAnswerRequest, filledFormID uuid.UUID) {
	q.ID = uuid.New()
	q.FilledFormID = filledFormID
	q.QuestionID = req.QuestionID
	q.Answer = req.Answer
	if req.SelectedChoices != nil {
		q.SelectedChoices = JSONStringArray(req.SelectedChoices)
	}
	q.CreatedAt = time.Now()
}

// UpdateFromRequest updates a FilledFormQuestion from UpdateAnswerRequest
func (q *FilledFormQuestion) UpdateFromRequest(req *UpdateAnswerRequest) {
	q.QuestionID = req.QuestionID
	q.Answer = req.Answer
	if req.SelectedChoices != nil {
		q.SelectedChoices = JSONStringArray(req.SelectedChoices)
	}
}
