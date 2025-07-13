package model

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
// @Description User account information
type User struct {
	ID           uuid.UUID `json:"id" db:"id" example:"550e8400-e29b-41d4-a716-446655440000"`   // User unique identifier
	Email        string    `json:"email" db:"email" example:"user@example.com"`                 // User email address
	PasswordHash string    `json:"-" db:"password_hash"`                                        // Never expose password hash in JSON
	Username     *string   `json:"username" db:"username" example:"johndoe"`                    // User's chosen username
	FamilyName   *string   `json:"family_name" db:"family_name" example:"Doe"`                  // User's family name
	GivenName    *string   `json:"given_name" db:"given_name" example:"John"`                   // User's given name
	CreatedAt    time.Time `json:"created_at" db:"created_at" example:"2023-01-01T10:00:00Z"`   // Account creation timestamp
	ModifiedAt   time.Time `json:"modified_at" db:"modified_at" example:"2023-01-01T10:00:00Z"` // Last update timestamp
}

// UserSession represents a user session
// @Description User authentication session
type UserSession struct {
	ID        uuid.UUID `json:"id" db:"id" example:"550e8400-e29b-41d4-a716-446655440001"`           // Session unique identifier
	UserID    uuid.UUID `json:"user_id" db:"user_id" example:"550e8400-e29b-41d4-a716-446655440000"` // Associated user ID
	Token     string    `json:"token" db:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`  // Session token
	ExpiresAt time.Time `json:"expires_at" db:"expires_at" example:"2023-01-02T10:00:00Z"`           // Session expiration time
	CreatedAt time.Time `json:"created_at" db:"created_at" example:"2023-01-01T10:00:00Z"`           // Session creation time
	UpdatedAt time.Time `json:"updated_at" db:"updated_at" example:"2023-01-01T10:00:00Z"`           // Last update time
}

// CreateUserRequest represents the request payload for creating a user
// @Description Request payload for user registration
type CreateUserRequest struct {
	Email      string  `json:"email" validate:"required,email" example:"user@example.com"` // User email address (required)
	Username   *string `json:"username,omitempty" example:"johndoe"`                       // Optional username
	FamilyName *string `json:"family_name,omitempty" example:"Doe"`                        // Optional family name
	GivenName  *string `json:"given_name,omitempty" example:"John"`                        // Optional given name
}

// UpdateUserRequest represents the request payload for updating a user
// @Description Request payload for updating user information
type UpdateUserRequest struct {
	Username   *string `json:"username,omitempty" example:"johndoe"` // Update username
	FamilyName *string `json:"family_name,omitempty" example:"Doe"`  // Update family name
	GivenName  *string `json:"given_name,omitempty" example:"John"`  // Update given name
}

// UserResponse represents the response payload for user data
type UserResponse struct {
	ID         uuid.UUID `json:"id"`
	Email      string    `json:"email"`
	Username   *string   `json:"username,omitempty"`
	FamilyName *string   `json:"family_name,omitempty"`
	GivenName  *string   `json:"given_name,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	ModifiedAt time.Time `json:"modified_at"`
}

// ToResponse converts a User to UserResponse
func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:         u.ID,
		Email:      u.Email,
		Username:   u.Username,
		FamilyName: u.FamilyName,
		GivenName:  u.GivenName,
		CreatedAt:  u.CreatedAt,
		ModifiedAt: u.ModifiedAt,
	}
}

// FromCreateRequest creates a User from CreateUserRequest
func (u *User) FromCreateRequest(req *CreateUserRequest) {
	u.ID = uuid.New()
	u.Email = req.Email
	u.Username = req.Username
	u.FamilyName = req.FamilyName
	u.GivenName = req.GivenName
	u.CreatedAt = time.Now()
	u.ModifiedAt = time.Now()
}

// UpdateFromRequest updates a User from UpdateUserRequest
func (u *User) UpdateFromRequest(req *UpdateUserRequest) {
	if req.Username != nil {
		u.Username = req.Username
	}
	if req.FamilyName != nil {
		u.FamilyName = req.FamilyName
	}
	if req.GivenName != nil {
		u.GivenName = req.GivenName
	}
	u.ModifiedAt = time.Now()
}
