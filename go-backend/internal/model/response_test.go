package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestFilledForm_ToDetailResponse(t *testing.T) {
	now := time.Now()
	form := &Form{ID: uuid.New(), Title: "Survey"}
	question := &Question{ID: uuid.New(), QuestionText: "Q1"}
	answer := &FilledFormQuestion{
		ID:         uuid.New(),
		QuestionID: question.ID,
		Answer:     stringPtr("A1"),
		Question:   question,
	}
	filledForm := &FilledForm{
		ID:        uuid.New(),
		FormID:    form.ID,
		Name:      stringPtr("John Doe"),
		Email:     stringPtr("john@example.com"),
		UserIP:    stringPtr("127.0.0.1"),
		CreatedAt: now,
		UpdatedAt: now,
		Answers:   []FilledFormQuestion{*answer},
		Form:      form,
	}

	resp := filledForm.ToDetailResponse()

	assert.Equal(t, filledForm.ID, resp.ID)
	assert.Equal(t, filledForm.FormID, resp.FormID)
	assert.Equal(t, filledForm.Name, resp.Name)
	assert.Equal(t, filledForm.Email, resp.Email)
	assert.Equal(t, filledForm.UserIP, resp.UserIP)
	assert.Len(t, resp.Answers, 1)
	assert.Equal(t, answer.ID, resp.Answers[0].ID)
	assert.NotNil(t, resp.Form)
	assert.Equal(t, form.ID, resp.Form.ID)
}

func TestFilledForm_ToDetailResponse_NilRelations(t *testing.T) {
	filledForm := &FilledForm{
		ID: uuid.New(),
	}

	resp := filledForm.ToDetailResponse()

	assert.Empty(t, resp.Answers)
	assert.Nil(t, resp.Form)
}

func TestFilledForm_FromCreateRequest(t *testing.T) {
	req := &CreateResponseRequest{
		FormID: uuid.New(),
		Name:   stringPtr("Jane Doe"),
		Email:  stringPtr("jane@example.com"),
	}
	userIP := "192.168.1.1"

	ff := &FilledForm{}
	ff.FromCreateRequest(req, userIP)

	assert.NotEqual(t, uuid.Nil, ff.ID)
	assert.Equal(t, req.FormID, ff.FormID)
	assert.Equal(t, req.Name, ff.Name)
	assert.Equal(t, req.Email, ff.Email)
	assert.Equal(t, &userIP, ff.UserIP)
	assert.WithinDuration(t, time.Now(), ff.CreatedAt, time.Second)
	assert.WithinDuration(t, time.Now(), ff.UpdatedAt, time.Second)
}

func TestFilledFormQuestion_ToResponse(t *testing.T) {
	now := time.Now()
	question := &Question{ID: uuid.New(), QuestionText: "Q1"}
	ffq := &FilledFormQuestion{
		ID:              uuid.New(),
		QuestionID:      question.ID,
		SelectedChoices: JSONStringArray{"Choice1", "Choice2"},
		CreatedAt:       now,
		Question:        question,
	}

	resp := ffq.ToResponse()

	assert.Equal(t, ffq.ID, resp.ID)
	assert.Equal(t, ffq.QuestionID, resp.QuestionID)
	assert.EqualValues(t, ffq.SelectedChoices, resp.SelectedChoices)
	assert.NotNil(t, resp.Question)
	assert.Equal(t, question.ID, resp.Question.ID)
}

func TestFilledFormQuestion_FromCreateRequest(t *testing.T) {
	filledFormID := uuid.New()
	req := &CreateAnswerRequest{
		QuestionID:      uuid.New(),
		Answer:          stringPtr("My answer"),
		SelectedChoices: []string{"A", "B"},
	}

	ffq := &FilledFormQuestion{}
	ffq.FromCreateRequest(req, filledFormID)

	assert.NotEqual(t, uuid.Nil, ffq.ID)
	assert.Equal(t, filledFormID, ffq.FilledFormID)
	assert.Equal(t, req.QuestionID, ffq.QuestionID)
	assert.Equal(t, req.Answer, ffq.Answer)
	assert.EqualValues(t, req.SelectedChoices, ffq.SelectedChoices)
	assert.WithinDuration(t, time.Now(), ffq.CreatedAt, time.Second)
}
