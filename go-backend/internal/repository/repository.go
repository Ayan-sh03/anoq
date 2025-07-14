package repository

import (
	"context"

	"github.com/ayan-sh03/anoq/internal/db"
	"github.com/ayan-sh03/anoq/internal/model"
	"github.com/google/uuid"
)

//go:generate go run github.com/golang/mock/mockgen -destination=mocks/mock_user_repository.go -package=mocks . UserRepo
//go:generate go run github.com/golang/mock/mockgen -destination=mocks/mock_form_repository.go -package=mocks . FormRepo
//go:generate go run github.com/golang/mock/mockgen -destination=mocks/mock_response_repository.go -package=mocks . ResponseRepo

type UserRepo interface {
	CreateUser(ctx context.Context, user *model.User) error
	GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error)
	GetUserByEmail(ctx context.Context, email string) (*model.User, error)
	UpdateUser(ctx context.Context, user *model.User) error
	HashPassword(password string) (string, error)
	CheckPassword(password, hash string) bool
	CreateSession(ctx context.Context, userID uuid.UUID) (*model.UserSession, error)
	GetSessionByToken(ctx context.Context, token string) (*model.UserSession, error)
	DeleteSession(ctx context.Context, token string) error
	CleanupExpiredSessions(ctx context.Context) error
}

type FormRepo interface {
	CreateForm(ctx context.Context, form *model.Form) error
	GetFormByID(ctx context.Context, id uuid.UUID) (*model.Form, error)
	GetFormBySlug(ctx context.Context, slug string) (*model.Form, error)
	ListFormsByUserID(ctx context.Context, userID uuid.UUID) ([]*model.Form, error)
	UpdateForm(ctx context.Context, form *model.Form) error
	DeleteForm(ctx context.Context, id uuid.UUID) error
	UpdateFormStatus(ctx context.Context, id uuid.UUID, status string) error
	GetDashboardStats(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error)
}

type ResponseRepo interface {
	CreateResponse(ctx context.Context, response *model.FilledForm, answers []model.CreateAnswerRequest) error
	GetResponseByID(ctx context.Context, id uuid.UUID) (*model.FilledForm, error)
	GetResponsesByFormID(ctx context.Context, formID uuid.UUID) ([]*model.FilledForm, error)
	GetResponsesListByFormID(ctx context.Context, formID uuid.UUID) ([]*model.FilledForm, error)
	GetFormSubmissionStats(ctx context.Context, formID uuid.UUID) (*model.FormSubmissionStats, error)
}

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
