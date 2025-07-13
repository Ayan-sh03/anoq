package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestQuestion_ToResponse(t *testing.T) {
	now := time.Now()
	q := &Question{
		ID:            uuid.New(),
		FormID:        uuid.New(),
		QuestionText:  "What is your favorite color?",
		Type:          QuestionTypeMultipleChoice,
		Position:      1,
		Required:      true,
		CreatedAt:     now,
		Choices:       JSONStringArray{"Red", "Green", "Blue"},
		AllowMultiple: true,
	}

	resp := q.ToResponse()

	assert.Equal(t, q.ID, resp.ID)
	assert.Equal(t, q.FormID, resp.FormID)
	assert.Equal(t, q.QuestionText, resp.QuestionText)
	assert.Equal(t, q.Type, resp.Type)
	assert.Equal(t, q.Position, resp.Position)
	assert.Equal(t, q.Required, resp.Required)
	assert.Equal(t, q.CreatedAt, resp.CreatedAt)
	assert.EqualValues(t, q.Choices, resp.Choices)
	assert.Equal(t, q.AllowMultiple, resp.AllowMultiple)
	assert.Nil(t, resp.Answer)
}

func TestQuestion_ToResponse_Basic(t *testing.T) {
	now := time.Now()
	answer := "An answer"
	q := &Question{
		ID:           uuid.New(),
		FormID:       uuid.New(),
		QuestionText: "What is your name?",
		Answer:       &answer,
		Type:         QuestionTypeBasic,
		Position:     2,
		Required:     false,
		CreatedAt:    now,
	}

	resp := q.ToResponse()

	assert.Equal(t, q.ID, resp.ID)
	assert.Equal(t, q.Type, resp.Type)
	assert.NotNil(t, resp.Answer)
	assert.Equal(t, answer, *resp.Answer)
	assert.Empty(t, resp.Choices)
}

func TestQuestion_FromCreateRequest_MultipleChoice(t *testing.T) {
	formID := uuid.New()
	req := &CreateQuestionRequest{
		QuestionText:  "Choose your skills",
		Type:          QuestionTypeMultipleChoice,
		Position:      1,
		Required:      true,
		Choices:       []string{"Go", "Python", "TypeScript"},
		AllowMultiple: true,
	}

	q := &Question{}
	q.FromCreateRequest(req, formID)

	assert.NotEqual(t, uuid.Nil, q.ID)
	assert.Equal(t, formID, q.FormID)
	assert.Equal(t, req.QuestionText, q.QuestionText)
	assert.Equal(t, req.Type, q.Type)
	assert.Equal(t, req.Position, q.Position)
	assert.Equal(t, req.Required, q.Required)
	assert.EqualValues(t, req.Choices, q.Choices)
	assert.Equal(t, req.AllowMultiple, q.AllowMultiple)
	assert.WithinDuration(t, time.Now(), q.CreatedAt, time.Second)
}

func TestQuestion_FromCreateRequest_Basic(t *testing.T) {
	formID := uuid.New()
	req := &CreateQuestionRequest{
		QuestionText: "What is your quest?",
		Type:         QuestionTypeBasic,
		Position:     2,
		Required:     false,
	}

	q := &Question{}
	q.FromCreateRequest(req, formID)

	assert.Equal(t, formID, q.FormID)
	assert.Equal(t, req.QuestionText, q.QuestionText)
	assert.Equal(t, req.Type, q.Type)
	assert.False(t, q.AllowMultiple)
	assert.Empty(t, q.Choices)
}

func TestQuestion_UpdateFromRequest(t *testing.T) {
	q := &Question{
		ID:            uuid.New(),
		QuestionText:  "Old Text",
		Type:          QuestionTypeBasic,
		Position:      1,
		Required:      true,
		Choices:       nil,
		AllowMultiple: false,
	}

	newType := QuestionTypeMultipleChoice
	newPosition := 2
	newRequired := false
	newAllowMultiple := true
	req := &UpdateQuestionRequest{
		QuestionText:  stringPtr("New Text"),
		Type:          &newType,
		Position:      &newPosition,
		Required:      &newRequired,
		Choices:       []string{"A", "B"},
		AllowMultiple: &newAllowMultiple,
	}

	q.UpdateFromRequest(req)

	assert.Equal(t, "New Text", q.QuestionText)
	assert.Equal(t, newType, q.Type)
	assert.Equal(t, newPosition, q.Position)
	assert.Equal(t, newRequired, q.Required)
	assert.EqualValues(t, []string{"A", "B"}, q.Choices)
	assert.Equal(t, newAllowMultiple, q.AllowMultiple)
}

func TestQuestion_UpdateFromRequest_Partial(t *testing.T) {
	q := &Question{
		ID:           uuid.New(),
		QuestionText: "Old Text",
		Position:     1,
	}

	req := &UpdateQuestionRequest{
		QuestionText: stringPtr("New Text"),
	}

	q.UpdateFromRequest(req)

	assert.Equal(t, "New Text", q.QuestionText)
	assert.Equal(t, 1, q.Position) // Unchanged
}

func TestQuestion_IsMultipleChoice(t *testing.T) {
	qMc := &Question{Type: QuestionTypeMultipleChoice}
	qBasic := &Question{Type: QuestionTypeBasic}

	assert.True(t, qMc.IsMultipleChoice())
	assert.False(t, qBasic.IsMultipleChoice())
}

func TestQuestion_IsBasic(t *testing.T) {
	qMc := &Question{Type: QuestionTypeMultipleChoice}
	qBasic := &Question{Type: QuestionTypeBasic}

	assert.False(t, qMc.IsBasic())
	assert.True(t, qBasic.IsBasic())
}
