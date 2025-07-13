package repository

import (
	"github.com/ayan-sh03/anoq/internal/db"
)

// UserRepository handles user data operations
type UserRepository struct {
	db *db.DB
}

// FormRepository handles form data operations
type FormRepository struct {
	db *db.DB
}

// QuestionRepository handles question data operations
type QuestionRepository struct {
	db *db.DB
}

// ResponseRepository handles response data operations
type ResponseRepository struct {
	db *db.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(database *db.DB) *UserRepository {
	return &UserRepository{
		db: database,
	}
}

// NewFormRepository creates a new form repository
func NewFormRepository(database *db.DB) *FormRepository {
	return &FormRepository{
		db: database,
	}
}

// NewQuestionRepository creates a new question repository
func NewQuestionRepository(database *db.DB) *QuestionRepository {
	return &QuestionRepository{
		db: database,
	}
}

// NewResponseRepository creates a new response repository
func NewResponseRepository(database *db.DB) *ResponseRepository {
	return &ResponseRepository{
		db: database,
	}
}
