package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestForm_ToResponse(t *testing.T) {
	now := time.Now()
	question := Question{
		ID:           uuid.New(),
		FormID:       uuid.New(),
		Type:         QuestionTypeBasic,
		QuestionText: "Sample question",
		Required:     true,
		Position:     1,
	}
	user := &User{
		ID:    uuid.New(),
		Email: "author@example.com",
	}
	form := &Form{
		ID:          uuid.New(),
		Title:       "Test Form",
		AuthorID:    user.ID,
		Description: "Test description",
		Slug:        "test-slug",
		Status:      FormStatusOpen,
		CreatedAt:   now,
		UpdatedAt:   now,
		Questions:   []Question{question},
		Author:      user,
	}

	resp := form.ToResponse()

	assert.Equal(t, form.ID, resp.ID)
	assert.Equal(t, form.Title, resp.Title)
	assert.Equal(t, form.AuthorID, resp.AuthorID)
	assert.Equal(t, form.Description, resp.Description)
	assert.Equal(t, form.Slug, resp.Slug)
	assert.Equal(t, form.Status, resp.Status)
	assert.Equal(t, form.CreatedAt, resp.CreatedAt)
	assert.Equal(t, form.UpdatedAt, resp.UpdatedAt)
	assert.Len(t, resp.Questions, 1)
	assert.Equal(t, question.ID, resp.Questions[0].ID)
	assert.NotNil(t, resp.Author)
	assert.Equal(t, user.ID, resp.Author.ID)
}

func TestForm_ToResponse_NoQuestionsNoAuthor(t *testing.T) {
	now := time.Now()
	form := &Form{
		ID:          uuid.New(),
		Title:       "Test Form",
		AuthorID:    uuid.New(),
		Description: "Test description",
		Slug:        "test-slug",
		Status:      FormStatusOpen,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	resp := form.ToResponse()

	assert.Empty(t, resp.Questions)
	assert.Nil(t, resp.Author)
}

func TestForm_FromCreateRequest(t *testing.T) {
	authorID := uuid.New()
	req := &CreateFormRequest{
		Title:       "Test Form",
		Description: "Test description",
		Slug:        "test-slug",
	}

	form := &Form{}
	form.FromCreateRequest(req, authorID)

	assert.NotEqual(t, uuid.Nil, form.ID)
	assert.Equal(t, req.Title, form.Title)
	assert.Equal(t, authorID, form.AuthorID)
	assert.Equal(t, req.Description, form.Description)
	assert.Equal(t, req.Slug, form.Slug)
	assert.Equal(t, FormStatusOpen, form.Status)
	assert.WithinDuration(t, time.Now(), form.CreatedAt, time.Second)
	assert.WithinDuration(t, time.Now(), form.UpdatedAt, time.Second)
	assert.Empty(t, form.Questions) // Not set in this method
}

func TestForm_UpdateFromRequest(t *testing.T) {
	now := time.Now().Add(-time.Hour)
	form := &Form{
		ID:          uuid.New(),
		Title:       "Old Title",
		Description: "Old description",
		Status:      FormStatusOpen,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	newStatus := FormStatusClosed
	req := &UpdateFormRequest{
		Title:       stringPtr("New Title"),
		Description: stringPtr("New description"),
		Status:      &newStatus,
	}

	form.UpdateFromRequest(req)

	assert.Equal(t, "New Title", form.Title)
	assert.Equal(t, "New description", form.Description)
	assert.Equal(t, FormStatusClosed, form.Status)
	assert.Equal(t, now, form.CreatedAt)
	assert.True(t, form.UpdatedAt.After(now))
	assert.WithinDuration(t, time.Now(), form.UpdatedAt, time.Second)
}

func TestForm_UpdateFromRequest_Partial(t *testing.T) {
	now := time.Now().Add(-time.Hour)
	form := &Form{
		ID:          uuid.New(),
		Title:       "Old Title",
		Description: "Old description",
		Status:      FormStatusOpen,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	req := &UpdateFormRequest{
		Description: stringPtr("New description"),
	}

	form.UpdateFromRequest(req)

	assert.Equal(t, "Old Title", form.Title) // Unchanged
	assert.Equal(t, "New description", form.Description)
	assert.Equal(t, FormStatusOpen, form.Status) // Unchanged
	assert.Equal(t, now, form.CreatedAt)
	assert.True(t, form.UpdatedAt.After(now))
}

func TestForm_UpdateFromRequest_AllNil(t *testing.T) {
	now := time.Now().Add(-time.Hour)
	form := &Form{
		ID:        uuid.New(),
		CreatedAt: now,
		UpdatedAt: now,
	}

	req := &UpdateFormRequest{}

	oldUpdatedAt := form.UpdatedAt
	form.UpdateFromRequest(req)

	assert.Equal(t, now, form.CreatedAt)
	assert.True(t, form.UpdatedAt.After(oldUpdatedAt))
}

func TestForm_IsOpen(t *testing.T) {
	formOpen := &Form{Status: FormStatusOpen}
	formClosed := &Form{Status: FormStatusClosed}

	assert.True(t, formOpen.IsOpen())
	assert.False(t, formClosed.IsOpen())
}

func TestForm_IsClosed(t *testing.T) {
	formOpen := &Form{Status: FormStatusOpen}
	formClosed := &Form{Status: FormStatusClosed}

	assert.False(t, formOpen.IsClosed())
	assert.True(t, formClosed.IsClosed())
}
