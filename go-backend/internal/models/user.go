package models

import "time"

type User struct {
	ID         int       `json:"id"`
	Email      string    `json:"email"`
	Username   *string   `json:"username,omitempty"`
	FamilyName *string   `json:"family_name,omitempty"`
	GivenName  *string   `json:"given_name,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type UserInput struct {
	Email      string  `json:"email"`
	Username   *string `json:"username,omitempty"`
	FamilyName *string `json:"family_name,omitempty"`
	GivenName  *string `json:"given_name,omitempty"`
}
