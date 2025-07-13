package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestUser_ToResponse(t *testing.T) {
	now := time.Now()
	user := &User{
		ID:           uuid.New(),
		Email:        "test@example.com",
		PasswordHash: "hashedpassword",
		Username:     stringPtr("testuser"),
		FamilyName:   stringPtr("Test"),
		GivenName:    stringPtr("User"),
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	resp := user.ToResponse()

	assert.Equal(t, user.ID, resp.ID)
	assert.Equal(t, user.Email, resp.Email)
	assert.Equal(t, user.Username, resp.Username)
	assert.Equal(t, user.FamilyName, resp.FamilyName)
	assert.Equal(t, user.GivenName, resp.GivenName)
	assert.Equal(t, user.CreatedAt, resp.CreatedAt)
	assert.Equal(t, user.UpdatedAt, resp.UpdatedAt)
}

func TestUser_FromCreateRequest(t *testing.T) {
	req := &CreateUserRequest{
		Email:      "test@example.com",
		Username:   stringPtr("testuser"),
		FamilyName: stringPtr("Test"),
		GivenName:  stringPtr("User"),
	}

	user := &User{}
	user.FromCreateRequest(req)

	assert.NotEqual(t, uuid.Nil, user.ID)
	assert.Equal(t, req.Email, user.Email)
	assert.Equal(t, req.Username, user.Username)
	assert.Equal(t, req.FamilyName, user.FamilyName)
	assert.Equal(t, req.GivenName, user.GivenName)
	assert.WithinDuration(t, time.Now(), user.CreatedAt, time.Second)
	assert.WithinDuration(t, time.Now(), user.UpdatedAt, time.Second)
	assert.Empty(t, user.PasswordHash) // Should be set elsewhere
}

func TestUser_FromCreateRequest_NilFields(t *testing.T) {
	req := &CreateUserRequest{
		Email: "test@example.com",
	}

	user := &User{}
	user.FromCreateRequest(req)

	assert.NotEqual(t, uuid.Nil, user.ID)
	assert.Equal(t, req.Email, user.Email)
	assert.Nil(t, user.Username)
	assert.Nil(t, user.FamilyName)
	assert.Nil(t, user.GivenName)
	assert.WithinDuration(t, time.Now(), user.CreatedAt, time.Second)
	assert.WithinDuration(t, time.Now(), user.UpdatedAt, time.Second)
}

func TestUser_UpdateFromRequest(t *testing.T) {
	now := time.Now().Add(-time.Hour) // Old time
	user := &User{
		ID:         uuid.New(),
		Email:      "test@example.com",
		Username:   stringPtr("olduser"),
		FamilyName: stringPtr("Old"),
		GivenName:  stringPtr("User"),
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	req := &UpdateUserRequest{
		Username:   stringPtr("newuser"),
		FamilyName: stringPtr("New"),
		// GivenName not updated
	}

	user.UpdateFromRequest(req)

	assert.Equal(t, "newuser", *user.Username)
	assert.Equal(t, "New", *user.FamilyName)
	assert.Equal(t, "User", *user.GivenName) // Unchanged
	assert.Equal(t, now, user.CreatedAt)     // Unchanged
	assert.True(t, user.UpdatedAt.After(now))
	assert.WithinDuration(t, time.Now(), user.UpdatedAt, time.Second)
}

func TestUser_UpdateFromRequest_Partial(t *testing.T) {
	now := time.Now().Add(-time.Hour)
	user := &User{
		ID:         uuid.New(),
		Email:      "test@example.com",
		Username:   stringPtr("olduser"),
		FamilyName: stringPtr("Old"),
		GivenName:  stringPtr("User"),
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	req := &UpdateUserRequest{
		GivenName: stringPtr("NewUser"),
	}

	user.UpdateFromRequest(req)

	assert.Equal(t, "olduser", *user.Username) // Unchanged
	assert.Equal(t, "Old", *user.FamilyName)   // Unchanged
	assert.Equal(t, "NewUser", *user.GivenName)
	assert.Equal(t, now, user.CreatedAt)
	assert.True(t, user.UpdatedAt.After(now))
}

func TestUser_UpdateFromRequest_AllNil(t *testing.T) {
	now := time.Now().Add(-time.Hour)
	user := &User{
		ID:        uuid.New(),
		Email:     "test@example.com",
		CreatedAt: now,
		UpdatedAt: now,
	}

	req := &UpdateUserRequest{}

	oldUpdatedAt := user.UpdatedAt
	user.UpdateFromRequest(req)

	assert.Equal(t, now, user.CreatedAt)
	assert.True(t, user.UpdatedAt.After(oldUpdatedAt))
	// No other changes
}
