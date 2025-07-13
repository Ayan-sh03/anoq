package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// QuestionType represents the type of a question
type QuestionType string

const (
	QuestionTypeBasic          QuestionType = "basic"
	QuestionTypeMultipleChoice QuestionType = "multiple_choice"
)

// JSONStringArray represents a JSON array of strings stored in database
type JSONStringArray []string

// Value implements the driver.Valuer interface
func (j JSONStringArray) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface
func (j *JSONStringArray) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("cannot scan JSONStringArray from non-[]byte")
	}

	return json.Unmarshal(bytes, j)
}

// Question represents a question in a form
// @Description Question structure containing question details and response options
type Question struct {
	ID           uuid.UUID    `json:"id" db:"id" example:"550e8400-e29b-41d4-a716-446655440003"`                                              // Question unique identifier
	FormID       uuid.UUID    `json:"form_id" db:"form_id" example:"550e8400-e29b-41d4-a716-446655440002"`                                    // Associated form ID
	QuestionText string       `json:"question_text" db:"question_text" validate:"required" example:"How satisfied are you with our service?"` // Question text content
	Answer       *string      `json:"answer,omitempty" db:"answer" example:"Very satisfied"`                                                  // Answer for basic questions
	Type         QuestionType `json:"type" db:"type" example:"multiple_choice"`                                                               // Question type (basic/multiple_choice)
	Position     int          `json:"position" db:"position" example:"1"`                                                                     // Question position in form
	Required     bool         `json:"required" db:"required" example:"true"`                                                                  // Whether question is required
	CreatedAt    time.Time    `json:"created_at" db:"created_at" example:"2023-01-01T10:00:00Z"`                                              // Question creation timestamp

	// Multiple choice specific fields
	Choices        JSONStringArray `json:"choices,omitempty" db:"choices" example:"[\"Very satisfied\", \"Satisfied\", \"Neutral\", \"Dissatisfied\", \"Very dissatisfied\"]"` // Available choices for multiple choice questions
	SelectedChoice JSONStringArray `json:"selected_choice,omitempty" db:"selected_choice" example:"[\"Very satisfied\"]"`                                                      // Selected choices
	AllowMultiple  bool            `json:"allow_multiple,omitempty" db:"allow_multiple" example:"false"`                                                                       // Whether multiple selections are allowed
}

// CreateQuestionRequest represents the request payload for creating a question
// @Description Request payload for creating a new question
type CreateQuestionRequest struct {
	QuestionText  string       `json:"question_text" validate:"required" example:"How satisfied are you with our service?"` // Question text (required)
	Type          QuestionType `json:"type" validate:"required" example:"multiple_choice"`                                  // Question type: basic or multiple_choice (required)
	Position      int          `json:"position" example:"1"`                                                                // Position in form (optional, auto-assigned if not provided)
	Required      bool         `json:"required" example:"true"`                                                             // Whether question is required
	Choices       []string     `json:"choices,omitempty" example:"[\"Very satisfied\", \"Satisfied\", \"Neutral\"]"`        // Choices for multiple_choice questions
	AllowMultiple bool         `json:"allow_multiple,omitempty" example:"false"`                                            // Allow multiple selections for multiple_choice questions
}

// UpdateQuestionRequest represents the request payload for updating a question
type UpdateQuestionRequest struct {
	ID            *uuid.UUID    `json:"id,omitempty"`
	QuestionText  *string       `json:"question_text,omitempty"`
	Type          *QuestionType `json:"type,omitempty"`
	Position      *int          `json:"position,omitempty"`
	Required      *bool         `json:"required,omitempty"`
	Choices       []string      `json:"choices,omitempty"`
	AllowMultiple *bool         `json:"allow_multiple,omitempty"`
}

// QuestionResponse represents the response payload for question data
type QuestionResponse struct {
	ID             uuid.UUID    `json:"id"`
	FormID         uuid.UUID    `json:"form_id"`
	QuestionText   string       `json:"question_text"`
	Answer         *string      `json:"answer,omitempty"`
	Type           QuestionType `json:"type"`
	Position       int          `json:"position"`
	Required       bool         `json:"required"`
	CreatedAt      time.Time    `json:"created_at"`
	Choices        []string     `json:"choices,omitempty"`
	SelectedChoice []string     `json:"selected_choice,omitempty"`
	AllowMultiple  bool         `json:"allow_multiple,omitempty"`
}

// ToResponse converts a Question to QuestionResponse
func (q *Question) ToResponse() *QuestionResponse {
	resp := &QuestionResponse{
		ID:           q.ID,
		FormID:       q.FormID,
		QuestionText: q.QuestionText,
		Answer:       q.Answer,
		Type:         q.Type,
		Position:     q.Position,
		Required:     q.Required,
		CreatedAt:    q.CreatedAt,
	}

	// Convert choices and selected choices
	if q.Choices != nil {
		resp.Choices = []string(q.Choices)
	}
	if q.SelectedChoice != nil {
		resp.SelectedChoice = []string(q.SelectedChoice)
	}
	resp.AllowMultiple = q.AllowMultiple

	return resp
}

// FromCreateRequest creates a Question from CreateQuestionRequest
func (q *Question) FromCreateRequest(req *CreateQuestionRequest, formID uuid.UUID) {
	q.ID = uuid.New()
	q.FormID = formID
	q.QuestionText = req.QuestionText
	q.Type = req.Type
	q.Position = req.Position
	q.Required = req.Required
	q.CreatedAt = time.Now()

	// Handle multiple choice specific fields
	if req.Type == QuestionTypeMultipleChoice {
		q.Choices = JSONStringArray(req.Choices)
		q.AllowMultiple = req.AllowMultiple
	}
}

// UpdateFromRequest updates a Question from UpdateQuestionRequest
func (q *Question) UpdateFromRequest(req *UpdateQuestionRequest) {
	if req.QuestionText != nil {
		q.QuestionText = *req.QuestionText
	}
	if req.Type != nil {
		q.Type = *req.Type
	}
	if req.Position != nil {
		q.Position = *req.Position
	}
	if req.Required != nil {
		q.Required = *req.Required
	}
	if req.Choices != nil {
		q.Choices = JSONStringArray(req.Choices)
	}
	if req.AllowMultiple != nil {
		q.AllowMultiple = *req.AllowMultiple
	}
}

// IsMultipleChoice returns true if the question is a multiple choice question
func (q *Question) IsMultipleChoice() bool {
	return q.Type == QuestionTypeMultipleChoice
}

// IsBasic returns true if the question is a basic text question
func (q *Question) IsBasic() bool {
	return q.Type == QuestionTypeBasic
}
