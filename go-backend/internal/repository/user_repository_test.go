package repository

import (
	"context"
	"database/sql"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/suite"

	"github.com/ayan-sh03/anoq/internal/db"
	"github.com/ayan-sh03/anoq/internal/model"
	"github.com/lib/pq"
)

type UserRepositorySuite struct {
	suite.Suite
	db   *sqlx.DB
	mock sqlmock.Sqlmock
	repo *UserRepository
}

func (s *UserRepositorySuite) SetupTest() {
	mockDB, mock, err := sqlmock.New()
	s.Require().NoError(err)
	s.db = sqlx.NewDb(mockDB, "sqlmock")
	s.mock = mock
	s.repo = &UserRepository{db: &db.DB{DB: s.db}}
}

func (s *UserRepositorySuite) TearDownTest() {
	s.mock.ExpectationsWereMet()
}

func TestUserRepositorySuite(t *testing.T) {
	suite.Run(t, new(UserRepositorySuite))
}

func (s *UserRepositorySuite) TestGetUserByID_Success() {
	id := uuid.New()
	now := time.Now()
	expectedUser := &model.User{
		ID:        id,
		Email:     "test@example.com",
		Username:  stringPtr("testuser"),
		CreatedAt: now,
		UpdatedAt: now,
	}

	rows := sqlmock.NewRows([]string{"id", "email", "password_hash", "username", "family_name", "given_name", "created_at", "updated_at"}).
		AddRow(expectedUser.ID, expectedUser.Email, "hash", expectedUser.Username, nil, nil, expectedUser.CreatedAt, expectedUser.UpdatedAt)

	query := `SELECT id, email, password_hash, username, family_name, given_name, created_at, updated_at FROM users WHERE id = $1`
	s.mock.ExpectQuery(regexp.QuoteMeta(query)).WithArgs(id).WillReturnRows(rows)

	user, err := s.repo.GetUserByID(context.Background(), id)

	s.Assert().NoError(err)
	s.Require().NotNil(user)
	s.Equal(expectedUser.ID, user.ID)
	s.Equal(expectedUser.Email, user.Email)
}

func (s *UserRepositorySuite) TestGetUserByID_NotFound() {
	id := uuid.New()
	query := `SELECT id, email, password_hash, username, family_name, given_name, created_at, updated_at FROM users WHERE id = $1`

	s.mock.ExpectQuery(regexp.QuoteMeta(query)).WithArgs(id).WillReturnError(sql.ErrNoRows)

	user, err := s.repo.GetUserByID(context.Background(), id)

	s.Require().Error(err)
	s.Nil(user)
	s.Contains(err.Error(), "user not found")
}

func (s *UserRepositorySuite) TestCreateUser_Success() {
	now := time.Now()
	newUser := &model.User{
		ID:           uuid.New(),
		Email:        "new@example.com",
		PasswordHash: "hashedpassword",
		Username:     stringPtr("newuser"),
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	query := `INSERT INTO users (id, email, password_hash, username, family_name, given_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).
		WithArgs(newUser.ID, newUser.Email, newUser.PasswordHash, newUser.Username, newUser.FamilyName, newUser.GivenName, newUser.CreatedAt, newUser.UpdatedAt).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.CreateUser(context.Background(), newUser)

	s.Require().NoError(err)
}

func (s *UserRepositorySuite) TestCreateUser_UniqueViolation() {
	now := time.Now()
	newUser := &model.User{
		ID:        uuid.New(),
		Email:     "exists@example.com",
		CreatedAt: now,
		UpdatedAt: now,
	}

	query := `INSERT INTO users`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).
		WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnError(&pq.Error{Code: "23505", Message: "duplicate key value violates unique constraint"}) // Simulate unique violation with a realistic message

	err := s.repo.CreateUser(context.Background(), newUser)

	s.Require().Error(err)
	s.Contains(err.Error(), "user with email exists@example.com already exists")
}

func (s *UserRepositorySuite) TestGetUserByEmail_Success() {
	email := "test@example.com"
	expectedUser := &model.User{
		ID:    uuid.New(),
		Email: email,
	}

	rows := sqlmock.NewRows([]string{"id", "email", "password_hash", "username", "family_name", "given_name", "created_at", "updated_at"}).
		AddRow(expectedUser.ID, expectedUser.Email, "hash", nil, nil, nil, time.Now(), time.Now())

	query := `SELECT id, email, password_hash, username, family_name, given_name, created_at, updated_at FROM users WHERE email = $1`
	s.mock.ExpectQuery(regexp.QuoteMeta(query)).WithArgs(email).WillReturnRows(rows)

	user, err := s.repo.GetUserByEmail(context.Background(), email)

	s.Require().NoError(err)
	s.Require().NotNil(user)
	s.Equal(expectedUser.ID, user.ID)
}

func (s *UserRepositorySuite) TestUpdateUser_Success() {
	now := time.Now()
	userToUpdate := &model.User{
		ID:        uuid.New(),
		Username:  stringPtr("updateduser"),
		UpdatedAt: now,
	}
	query := `UPDATE users SET username = $2, family_name = $3, given_name = $4, updated_at = $5 WHERE id = $1`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).
		WithArgs(userToUpdate.ID, userToUpdate.Username, userToUpdate.FamilyName, userToUpdate.GivenName, userToUpdate.UpdatedAt).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.UpdateUser(context.Background(), userToUpdate)

	s.Require().NoError(err)
}

func (s *UserRepositorySuite) TestUpdateUser_NotFound() {
	now := time.Now()
	userToUpdate := &model.User{
		ID:        uuid.New(),
		Username:  stringPtr("updateduser"),
		UpdatedAt: now,
	}
	query := `UPDATE users SET username = $2, family_name = $3, given_name = $4, updated_at = $5 WHERE id = $1`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).
		WithArgs(userToUpdate.ID, userToUpdate.Username, userToUpdate.FamilyName, userToUpdate.GivenName, userToUpdate.UpdatedAt).
		WillReturnResult(sqlmock.NewResult(0, 0)) // 0 rows affected

	err := s.repo.UpdateUser(context.Background(), userToUpdate)

	s.Require().Error(err)
	s.Contains(err.Error(), "user not found")
}

func (s *UserRepositorySuite) TestPasswordHashing() {
	password := "password123"
	hash, err := s.repo.HashPassword(password)
	s.Require().NoError(err)
	s.NotEmpty(hash)
	s.NotEqual(password, hash)

	s.True(s.repo.CheckPassword(password, hash))
	s.False(s.repo.CheckPassword("wrongpassword", hash))
}

func (s *UserRepositorySuite) TestCreateSession_Success() {
	userID := uuid.New()
	query := `INSERT INTO user_sessions (id, user_id, token, expires_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).
		WithArgs(sqlmock.AnyArg(), userID, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	session, err := s.repo.CreateSession(context.Background(), userID)
	s.Require().NoError(err)
	s.Require().NotNil(session)
	s.Equal(userID, session.UserID)
	s.NotEmpty(session.Token)
}

func (s *UserRepositorySuite) TestGetSessionByToken_Success() {
	token := "valid-token"
	expectedSession := &model.UserSession{
		ID:     uuid.New(),
		UserID: uuid.New(),
		Token:  token,
	}
	rows := sqlmock.NewRows([]string{"id", "user_id", "token", "expires_at", "created_at", "updated_at"}).
		AddRow(expectedSession.ID, expectedSession.UserID, expectedSession.Token, time.Now().Add(time.Hour), time.Now(), time.Now())

	query := `SELECT id, user_id, token, expires_at, created_at, updated_at FROM user_sessions WHERE token = $1 AND expires_at > NOW()`
	s.mock.ExpectQuery(regexp.QuoteMeta(query)).WithArgs(token).WillReturnRows(rows)

	session, err := s.repo.GetSessionByToken(context.Background(), token)

	s.Require().NoError(err)
	s.Require().NotNil(session)
	s.Equal(expectedSession.ID, session.ID)
}

func (s *UserRepositorySuite) TestDeleteSession_Success() {
	token := "token-to-delete"
	query := `DELETE FROM user_sessions WHERE token = $1`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).WithArgs(token).WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.DeleteSession(context.Background(), token)
	s.Require().NoError(err)
}

func (s *UserRepositorySuite) TestCleanupExpiredSessions() {
	query := `DELETE FROM user_sessions WHERE expires_at < NOW()`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).WillReturnResult(sqlmock.NewResult(5, 5)) // Assume 5 sessions were cleaned up

	err := s.repo.CleanupExpiredSessions(context.Background())
	s.Require().NoError(err)
}
