package model

import (
	"time"

	"github.com/google/uuid"
)

// FormStatus represents the status of a form
type FormStatus string

const (
	FormStatusOpen   FormStatus = "open"
	FormStatusClosed FormStatus = "closed"
)

// Form represents a form in the system
// @Description Form structure containing all form details
type Form struct {
	ID          uuid.UUID  `json:"id" db:"id" example:"550e8400-e29b-41d4-a716-446655440002"`                           // Form unique identifier
	Title       string     `json:"title" db:"title" validate:"required,min=1,max=255" example:"Customer Feedback Form"` // Form title
	AuthorID    uuid.UUID  `json:"author_id" db:"author_id" example:"550e8400-e29b-41d4-a716-446655440000"`             // Form creator's user ID
	Description string     `json:"description" db:"description" example:"A form to collect customer feedback"`          // Form description
	Slug        string     `json:"slug" db:"slug" validate:"required,min=1,max=255" example:"customer-feedback-2023"`   // URL-friendly form identifier
	Status      FormStatus `json:"status" db:"status" example:"open"`                                                   // Form status (open/closed)
	CreatedAt   time.Time  `json:"created_at" db:"created_at" example:"2023-01-01T10:00:00Z"`                           // Form creation timestamp
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at" example:"2023-01-01T10:00:00Z"`                           // Last modification timestamp
	Questions   []Question `json:"questions,omitempty"`                                                                 // List of questions in the form
	Author      *User      `json:"author,omitempty"`                                                                    // Form author details
}

// CreateFormRequest represents the request payload for creating a form
// @Description Request payload for creating a new form
type CreateFormRequest struct {
	Title       string                  `json:"title" validate:"required,min=1,max=255" example:"Customer Feedback Form"` // Form title (required)
	Description string                  `json:"description" example:"A form to collect customer feedback"`                // Form description
	Slug        string                  `json:"slug" validate:"required,min=1,max=255" example:"customer-feedback-2023"`  // URL-friendly identifier (required)
	Questions   []CreateQuestionRequest `json:"questions,omitempty"`                                                      // Optional list of questions to create with the form
}

// UpdateFormRequest represents the request payload for updating a form
type UpdateFormRequest struct {
	Title       *string                 `json:"title,omitempty" validate:"omitempty,min=1,max=255"`
	Description *string                 `json:"description,omitempty"`
	Status      *FormStatus             `json:"status,omitempty"`
	Questions   []UpdateQuestionRequest `json:"questions,omitempty"`
}

// FormResponse represents the response payload for form data
type FormResponse struct {
	ID          uuid.UUID          `json:"id"`
	Title       string             `json:"title"`
	AuthorID    uuid.UUID          `json:"author_id"`
	Description string             `json:"description"`
	Slug        string             `json:"slug"`
	Status      FormStatus         `json:"status"`
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
	Questions   []QuestionResponse `json:"questions,omitempty"`
	Author      *UserResponse      `json:"author,omitempty"`
}

// FormListResponse represents the response payload for form list
type FormListResponse struct {
	ID              uuid.UUID  `json:"id"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Slug            string     `json:"slug"`
	Status          FormStatus `json:"status"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	QuestionCount   int        `json:"question_count"`
	SubmissionCount int        `json:"submission_count"`
}

// FormStats represents form statistics
type FormStats struct {
	TotalForms       int `json:"total_forms"`
	OpenForms        int `json:"open_forms"`
	ClosedForms      int `json:"closed_forms"`
	TotalSubmissions int `json:"total_submissions"`
}

// ToResponse converts a Form to FormResponse
func (f *Form) ToResponse() *FormResponse {
	resp := &FormResponse{
		ID:          f.ID,
		Title:       f.Title,
		AuthorID:    f.AuthorID,
		Description: f.Description,
		Slug:        f.Slug,
		Status:      f.Status,
		CreatedAt:   f.CreatedAt,
		UpdatedAt:   f.UpdatedAt,
	}

	// Convert questions
	if f.Questions != nil {
		resp.Questions = make([]QuestionResponse, len(f.Questions))
		for i, q := range f.Questions {
			resp.Questions[i] = *q.ToResponse()
		}
	}

	// Convert author
	if f.Author != nil {
		resp.Author = f.Author.ToResponse()
	}

	return resp
}

// FromCreateRequest creates a Form from CreateFormRequest
func (f *Form) FromCreateRequest(req *CreateFormRequest, authorID uuid.UUID) {
	f.ID = uuid.New()
	f.Title = req.Title
	f.AuthorID = authorID
	f.Description = req.Description
	f.Slug = req.Slug
	f.Status = FormStatusOpen
	f.CreatedAt = time.Now()
	f.UpdatedAt = time.Now()
}

// UpdateFromRequest updates a Form from UpdateFormRequest
func (f *Form) UpdateFromRequest(req *UpdateFormRequest) {
	if req.Title != nil {
		f.Title = *req.Title
	}
	if req.Description != nil {
		f.Description = *req.Description
	}
	if req.Status != nil {
		f.Status = *req.Status
	}
	f.UpdatedAt = time.Now()
}

// IsOpen returns true if the form is open for submissions
func (f *Form) IsOpen() bool {
	return f.Status == FormStatusOpen
}

// IsClosed returns true if the form is closed for submissions
func (f *Form) IsClosed() bool {
	return f.Status == FormStatusClosed
}
