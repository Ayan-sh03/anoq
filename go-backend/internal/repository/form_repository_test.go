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
	"github.com/lib/pq"
	"github.com/stretchr/testify/suite"

	"github.com/ayan-sh03/anoq/internal/db"
	"github.com/ayan-sh03/anoq/internal/model"
)

type FormRepositorySuite struct {
	suite.Suite
	db   *sqlx.DB
	mock sqlmock.Sqlmock
	repo *FormRepository
}

func (s *FormRepositorySuite) SetupTest() {
	mockDB, mock, err := sqlmock.New()
	s.Require().NoError(err)
	s.db = sqlx.NewDb(mockDB, "sqlmock")
	s.mock = mock
	s.repo = &FormRepository{db: &db.DB{DB: s.db}}
}

func (s *FormRepositorySuite) TearDownTest() {
	s.mock.ExpectationsWereMet()
}

func TestFormRepositorySuite(t *testing.T) {
	suite.Run(t, new(FormRepositorySuite))
}

func (s *FormRepositorySuite) TestCreateForm_Success() {
	form := &model.Form{
		ID:          uuid.New(),
		Title:       "Test Form",
		Description: "A test form.",
		Slug:        "test-form",
		AuthorID:    uuid.New(),
		Status:      model.FormStatusOpen,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	query := `INSERT INTO forms (id, title, description, slug, author_id, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).
		WithArgs(form.ID, form.Title, form.Description, form.Slug, form.AuthorID, form.Status, form.CreatedAt, form.UpdatedAt).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.CreateForm(context.Background(), form)
	s.Require().NoError(err)
}

func (s *FormRepositorySuite) TestCreateForm_UniqueViolation() {
	form := &model.Form{
		ID:   uuid.New(),
		Slug: "existing-slug",
	}

	query := `INSERT INTO forms`
	s.mock.ExpectExec(query).WillReturnError(&pq.Error{Code: "23505", Message: "duplicate key"})

	err := s.repo.CreateForm(context.Background(), form)
	s.Require().Error(err)
	s.Contains(err.Error(), "form with slug existing-slug already exists")
}

func (s *FormRepositorySuite) TestGetFormBySlug_Success() {
	slug := "test-form"
	expectedForm := &model.Form{
		ID:    uuid.New(),
		Slug:  slug,
		Title: "Test Form",
	}

	rows := sqlmock.NewRows([]string{"id", "title", "description", "slug", "author_id", "status", "created_at", "updated_at"}).
		AddRow(expectedForm.ID, expectedForm.Title, "", expectedForm.Slug, uuid.New(), "open", time.Now(), time.Now())

	query := `SELECT id, title, description, slug, author_id, status, created_at, updated_at FROM forms WHERE slug = $1`
	s.mock.ExpectQuery(regexp.QuoteMeta(query)).WithArgs(slug).WillReturnRows(rows)

	form, err := s.repo.GetFormBySlug(context.Background(), slug)
	s.Require().NoError(err)
	s.Require().NotNil(form)
	s.Equal(expectedForm.ID, form.ID)
}

func (s *FormRepositorySuite) TestGetForm_NotFound() {
	id := uuid.New()
	slug := "non-existent-form"

	// Test by ID
	idQuery := `SELECT id, title, description, slug, author_id, status, created_at, updated_at FROM forms WHERE id = $1`
	s.mock.ExpectQuery(regexp.QuoteMeta(idQuery)).WithArgs(id).WillReturnError(sql.ErrNoRows)
	_, err := s.repo.GetFormByID(context.Background(), id)
	s.Require().Error(err)
	s.Contains(err.Error(), "form not found")

	// Test by Slug
	slugQuery := `SELECT id, title, description, slug, author_id, status, created_at, updated_at FROM forms WHERE slug = $1`
	s.mock.ExpectQuery(regexp.QuoteMeta(slugQuery)).WithArgs(slug).WillReturnError(sql.ErrNoRows)
	_, err = s.repo.GetFormBySlug(context.Background(), slug)
	s.Require().Error(err)
	s.Contains(err.Error(), "form not found")
}

func (s *FormRepositorySuite) TestListFormsByUserID() {
	userID := uuid.New()
	rows := sqlmock.NewRows([]string{"id", "title", "description", "slug", "author_id", "status", "created_at", "updated_at"}).
		AddRow(uuid.New(), "Form 1", "", "form-1", userID, "open", time.Now(), time.Now()).
		AddRow(uuid.New(), "Form 2", "", "form-2", userID, "closed", time.Now(), time.Now())

	query := `SELECT id, title, description, slug, author_id, status, created_at, updated_at FROM forms WHERE author_id = $1 ORDER BY created_at DESC`
	s.mock.ExpectQuery(regexp.QuoteMeta(query)).WithArgs(userID).WillReturnRows(rows)

	forms, err := s.repo.ListFormsByUserID(context.Background(), userID)
	s.Require().NoError(err)
	s.Len(forms, 2)
}

func (s *FormRepositorySuite) TestListFormsByUserID_Empty() {
	userID := uuid.New()
	rows := sqlmock.NewRows([]string{"id", "title", "description", "slug", "author_id", "status", "created_at", "updated_at"})

	query := `SELECT id, title, description, slug, author_id, status, created_at, updated_at FROM forms WHERE author_id = $1 ORDER BY created_at DESC`
	s.mock.ExpectQuery(regexp.QuoteMeta(query)).WithArgs(userID).WillReturnRows(rows)

	forms, err := s.repo.ListFormsByUserID(context.Background(), userID)
	s.Require().NoError(err)
	s.Len(forms, 0) // Expect an empty slice, not nil
}

func (s *FormRepositorySuite) TestUpdateForm_Success() {
	form := &model.Form{
		ID:          uuid.New(),
		Title:       "Updated Title",
		Description: "Updated Desc",
		Status:      model.FormStatusClosed,
		UpdatedAt:   time.Now(),
	}
	query := `UPDATE forms SET title = $2, description = $3, status = $4, updated_at = $5 WHERE id = $1`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).
		WithArgs(form.ID, form.Title, form.Description, form.Status, form.UpdatedAt).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.UpdateForm(context.Background(), form)
	s.Require().NoError(err)
}

func (s *FormRepositorySuite) TestUpdateForm_NotFound() {
	form := &model.Form{ID: uuid.New(), UpdatedAt: time.Now()}
	query := `UPDATE forms`
	s.mock.ExpectExec(query).WillReturnResult(sqlmock.NewResult(0, 0))

	err := s.repo.UpdateForm(context.Background(), form)
	s.Require().Error(err)
	s.Contains(err.Error(), "form not found")
}

func (s *FormRepositorySuite) TestDeleteForm_Success() {
	formID := uuid.New()
	query := `DELETE FROM forms WHERE id = $1`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).WithArgs(formID).WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.DeleteForm(context.Background(), formID)
	s.Require().NoError(err)
}

func (s *FormRepositorySuite) TestDeleteForm_NotFound() {
	formID := uuid.New()
	query := `DELETE FROM forms WHERE id = $1`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).WithArgs(formID).WillReturnResult(sqlmock.NewResult(0, 0))

	err := s.repo.DeleteForm(context.Background(), formID)
	s.Require().Error(err)
	s.Contains(err.Error(), "form not found")
}

func (s *FormRepositorySuite) TestUpdateFormStatus_Success() {
	formID := uuid.New()
	status := "closed"
	query := `UPDATE forms SET status = $2, updated_at = $3 WHERE id = $1`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).WithArgs(formID, status, sqlmock.AnyArg()).WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.UpdateFormStatus(context.Background(), formID, status)
	s.Require().NoError(err)
}

func (s *FormRepositorySuite) TestGetDashboardStats_Success() {
	userID := uuid.New()

	// Mock for total forms
	s.mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(*) FROM forms WHERE author_id = $1")).
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))

	// Mock for total responses
	s.mock.ExpectQuery(regexp.QuoteMeta(`SELECT COUNT(*) FROM filled_forms ff JOIN forms f ON ff.form_id = f.id WHERE f.author_id = $1`)).
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(120))

	// Mock for active forms
	s.mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(*) FROM forms WHERE author_id = $1 AND status = 'open'")).
		WithArgs(userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))

	stats, err := s.repo.GetDashboardStats(context.Background(), userID)
	s.Require().NoError(err)
	s.Equal(5, stats["totalForms"])
	s.Equal(120, stats["totalResponses"])
	s.Equal(3, stats["activeForms"])
}
