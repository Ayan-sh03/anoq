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
)

type ResponseRepositorySuite struct {
	suite.Suite
	db   *sqlx.DB
	mock sqlmock.Sqlmock
	repo *ResponseRepository
}

func (s *ResponseRepositorySuite) SetupTest() {
	mockDB, mock, err := sqlmock.New()
	s.Require().NoError(err)
	s.db = sqlx.NewDb(mockDB, "sqlmock")
	s.mock = mock
	s.repo = &ResponseRepository{db: &db.DB{DB: s.db}}
}

func (s *ResponseRepositorySuite) TearDownTest() {
	s.mock.ExpectationsWereMet()
}

func TestResponseRepositorySuite(t *testing.T) {
	suite.Run(t, new(ResponseRepositorySuite))
}

func (s *ResponseRepositorySuite) TestCreateResponse_Success() {
	response := &model.FilledForm{
		ID:        uuid.New(),
		FormID:    uuid.New(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	answers := []model.CreateAnswerRequest{
		{QuestionID: uuid.New(), Answer: stringPtr("Answer 1")},
		{QuestionID: uuid.New(), SelectedChoices: []string{"Choice A"}},
	}

	s.mock.ExpectBegin()

	// Expect insert into filled_forms
	ffQuery := `INSERT INTO filled_forms (id, form_id, name, email, user_ip, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	s.mock.ExpectExec(regexp.QuoteMeta(ffQuery)).
		WithArgs(response.ID, response.FormID, response.Name, response.Email, response.UserIP, response.CreatedAt, response.UpdatedAt).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Expect inserts into filled_form_questions
	ffqQuery := `INSERT INTO filled_form_questions (id, filled_form_id, question_id, answer, selected_choices, created_at) VALUES ($1, $2, $3, $4, $5, $6)`
	for range answers {
		s.mock.ExpectExec(regexp.QuoteMeta(ffqQuery)).
			WithArgs(sqlmock.AnyArg(), response.ID, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
			WillReturnResult(sqlmock.NewResult(1, 1))
	}

	s.mock.ExpectCommit()

	err := s.repo.CreateResponse(context.Background(), response, answers)
	s.Require().NoError(err)
}

func (s *ResponseRepositorySuite) TestCreateResponse_Rollback() {
	response := &model.FilledForm{
		ID: uuid.New(),
	}
	answers := []model.CreateAnswerRequest{
		{QuestionID: uuid.New(), Answer: stringPtr("This will fail")},
	}

	s.mock.ExpectBegin()
	s.mock.ExpectExec(`INSERT INTO filled_forms`).WillReturnResult(sqlmock.NewResult(1, 1))
	s.mock.ExpectExec(`INSERT INTO filled_form_questions`).WillReturnError(sql.ErrConnDone)
	s.mock.ExpectRollback()

	err := s.repo.CreateResponse(context.Background(), response, answers)
	s.Require().Error(err)
	s.Contains(err.Error(), "failed to create answer")
}

func (s *ResponseRepositorySuite) TestGetResponseByID_Success() {
	responseID := uuid.New()
	formID := uuid.New()

	// Mock for GetResponseByID itself
	respRows := sqlmock.NewRows([]string{"id", "form_id", "name", "email", "user_ip", "created_at", "updated_at"}).
		AddRow(responseID, formID, nil, nil, nil, time.Now(), time.Now())
	s.mock.ExpectQuery(`SELECT id, form_id, name, email, user_ip, created_at, updated_at FROM filled_forms WHERE id = \$1`).
		WithArgs(responseID).
		WillReturnRows(respRows)

	// Mock for the internal getAnswersByFilledFormID call
	answerRows := sqlmock.NewRows([]string{
		"ffq_id", "ffq_filled_form_id", "ffq_question_id", "ffq_answer", "ffq_selected_choices", "ffq_created_at",
		"q_id", "q_form_id", "q_question_text", "q_answer", "q_type", "q_position", "q_required", "q_created_at",
		"mc_choices", "mc_allow_multiple",
	}).AddRow(
		uuid.New(), responseID, uuid.New(), "Answer text", nil, time.Now(),
		uuid.New(), formID, "Question text", nil, "basic", 1, true, time.Now(),
		nil, nil,
	)
	s.mock.ExpectQuery(`SELECT ffq.id, ffq.filled_form_id, ffq.question_id, ffq.answer, ffq.selected_choices, ffq.created_at, q.id, q.form_id, q.question_text, q.answer, q.type, q.position, q.required, q.created_at, mc.choices, mc.allow_multiple FROM filled_form_questions ffq INNER JOIN questions q ON ffq.question_id = q.id LEFT JOIN multiple_choice_questions mc ON q.id = mc.question_id WHERE ffq.filled_form_id = \$1`).
		WithArgs(responseID).
		WillReturnRows(answerRows)

	resp, err := s.repo.GetResponseByID(context.Background(), responseID)
	s.Require().NoError(err)
	s.Require().NotNil(resp)
	s.Equal(responseID, resp.ID)
	s.Len(resp.Answers, 1)
	s.NotNil(resp.Answers[0].Question)
}

func (s *ResponseRepositorySuite) TestDeleteResponse_Success() {
	respID := uuid.New()

	s.mock.ExpectBegin()
	s.mock.ExpectExec(`DELETE FROM filled_form_questions WHERE filled_form_id = \$1`).WithArgs(respID).WillReturnResult(sqlmock.NewResult(5, 5))
	s.mock.ExpectExec(`DELETE FROM filled_forms WHERE id = \$1`).WithArgs(respID).WillReturnResult(sqlmock.NewResult(1, 1))
	s.mock.ExpectCommit()

	err := s.repo.DeleteResponse(context.Background(), respID)
	s.Require().NoError(err)
}
