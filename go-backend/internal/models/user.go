package models

import "time"

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	Username     *string   `json:"username,omitempty"`
	FamilyName   *string   `json:"family_name,omitempty"`
	GivenName    *string   `json:"given_name,omitempty"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type UserInput struct {
	Email        string  `json:"email"`
	Username     *string `json:"username,omitempty"`
	FamilyName   *string `json:"family_name,omitempty"`
	GivenName    *string `json:"given_name,omitempty"`
	Password     string  `json:"password,omitempty"`
	PasswordHash string  `json:"-"`
}

type UserLogin struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type UserRegister struct {
	Email        string  `json:"email" validate:"required,email"`
	Password     string  `json:"password" validate:"required,min=8"`
	Username     *string `json:"username,omitempty"`
	FamilyName   *string `json:"family_name,omitempty"`
	GivenName    *string `json:"given_name,omitempty"`
}

type AuthResponse struct {
	User         *User      `json:"user"`
	AccessToken  string     `json:"access_token"`
	RefreshToken string     `json:"refresh_token"`
	ExpiresAt    int64      `json:"expires_at"`
}
