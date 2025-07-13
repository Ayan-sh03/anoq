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

type QuestionRepositorySuite struct {
	suite.Suite
	db   *sqlx.DB
	mock sqlmock.Sqlmock
	repo *QuestionRepository
}

func (s *QuestionRepositorySuite) SetupTest() {
	mockDB, mock, err := sqlmock.New()
	s.Require().NoError(err)
	s.db = sqlx.NewDb(mockDB, "sqlmock")
	s.mock = mock
	s.repo = &QuestionRepository{db: &db.DB{DB: s.db}}
}

func (s *QuestionRepositorySuite) TearDownTest() {
	s.mock.ExpectationsWereMet()
}

func TestQuestionRepositorySuite(t *testing.T) {
	suite.Run(t, new(QuestionRepositorySuite))
}

func (s *QuestionRepositorySuite) TestCreateQuestion_Basic() {
	q := &model.Question{
		ID:           uuid.New(),
		FormID:       uuid.New(),
		QuestionText: "Basic question?",
		Type:         model.QuestionTypeBasic,
		Position:     1,
		Required:     true,
		CreatedAt:    time.Now(),
	}

	query := `INSERT INTO questions (id, form_id, question_text, answer, type, position, required, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	s.mock.ExpectExec(regexp.QuoteMeta(query)).
		WithArgs(q.ID, q.FormID, q.QuestionText, q.Answer, q.Type, q.Position, q.Required, q.CreatedAt).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.CreateQuestion(context.Background(), q)
	s.Require().NoError(err)
}

func (s *QuestionRepositorySuite) TestCreateQuestion_MultipleChoice() {
	q := &model.Question{
		ID:            uuid.New(),
		FormID:        uuid.New(),
		QuestionText:  "MCQ?",
		Type:          model.QuestionTypeMultipleChoice,
		Position:      1,
		Choices:       model.JSONStringArray{"A", "B"},
		AllowMultiple: true,
		CreatedAt:     time.Now(),
	}

	insertQQuery := `INSERT INTO questions`
	s.mock.ExpectExec(insertQQuery).
		WithArgs(q.ID, q.FormID, q.QuestionText, q.Answer, q.Type, q.Position, q.Required, q.CreatedAt).
		WillReturnResult(sqlmock.NewResult(1, 1))

	insertMCQQuery := `INSERT INTO multiple_choice_questions (id, question_id, choices, allow_multiple) VALUES ($1, $2, $3, $4)`
	s.mock.ExpectExec(regexp.QuoteMeta(insertMCQQuery)).
		WithArgs(sqlmock.AnyArg(), q.ID, q.Choices, q.AllowMultiple).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.CreateQuestion(context.Background(), q)
	s.Require().NoError(err)
}

func (s *QuestionRepositorySuite) TestCreateQuestion_MCQError() {
	q := &model.Question{Type: model.QuestionTypeMultipleChoice}

	s.mock.ExpectExec(`INSERT INTO questions`).WillReturnResult(sqlmock.NewResult(1, 1))
	s.mock.ExpectExec(`INSERT INTO multiple_choice_questions`).WillReturnError(sql.ErrConnDone)

	err := s.repo.CreateQuestion(context.Background(), q)
	s.Require().Error(err)
	s.Contains(err.Error(), "failed to create multiple choice question")
}

func (s *QuestionRepositorySuite) TestUpdateQuestion_CreateMCQonUpdate() {
	q := &model.Question{ID: uuid.New(), Type: model.QuestionTypeMultipleChoice}

	// Mock the main update on the questions table
	s.mock.ExpectExec(`UPDATE questions`).WillReturnResult(sqlmock.NewResult(1, 1))
	// Mock the check for multiple_choice_questions existence to return 'false'
	s.mock.ExpectQuery(`SELECT EXISTS`).WithArgs(q.ID).WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))
	// Expect an INSERT since it didn't exist
	s.mock.ExpectExec(`INSERT INTO multiple_choice_questions`).WithArgs(sqlmock.AnyArg(), q.ID, q.Choices, q.AllowMultiple).WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.UpdateQuestion(context.Background(), q)
	s.Require().NoError(err)
}

func (s *QuestionRepositorySuite) TestUpdateQuestion_UpdateExistingMCQ() {
	q := &model.Question{ID: uuid.New(), Type: model.QuestionTypeMultipleChoice}

	s.mock.ExpectExec(`UPDATE questions`).WillReturnResult(sqlmock.NewResult(1, 1))
	s.mock.ExpectQuery(`SELECT EXISTS`).WithArgs(q.ID).WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))
	s.mock.ExpectExec(`UPDATE multiple_choice_questions`).WithArgs(q.Choices, q.AllowMultiple, q.ID).WillReturnResult(sqlmock.NewResult(1, 1))

	err := s.repo.UpdateQuestion(context.Background(), q)
	s.Require().NoError(err)
}

func (s *QuestionRepositorySuite) TestGetQuestionByID_NotFound() {
	id := uuid.New()
	query := `SELECT q.id, q.form_id, q.question_text, q.answer, q.type, q.position, q.required, q.created_at, mc.choices, mc.allow_multiple FROM questions q LEFT JOIN multiple_choice_questions mc ON q.id = mc.question_id WHERE q.id = $1`
	s.mock.ExpectQuery(regexp.QuoteMeta(query)).WithArgs(id).WillReturnError(sql.ErrNoRows)

	_, err := s.repo.GetQuestionByID(context.Background(), id)
	s.Require().Error(err)
	s.Contains(err.Error(), "question not found")
}

func (s *QuestionRepositorySuite) TestDeleteQuestion() {
	qID := uuid.New()

	s.mock.ExpectBegin()
	s.mock.ExpectExec(`DELETE FROM multiple_choice_questions WHERE question_id = \$1`).WithArgs(qID).WillReturnResult(sqlmock.NewResult(1, 1))
	s.mock.ExpectExec(`DELETE FROM questions WHERE id = \$1`).WithArgs(qID).WillReturnResult(sqlmock.NewResult(1, 1))
	s.mock.ExpectCommit()

	err := s.repo.DeleteQuestion(context.Background(), qID)
	s.Require().NoError(err)
}

func (s *QuestionRepositorySuite) TestDeleteQuestion_TransactionFailure() {
	qID := uuid.New()

	s.mock.ExpectBegin()
	s.mock.ExpectExec(`DELETE FROM multiple_choice_questions`).WillReturnError(sql.ErrConnDone)
	s.mock.ExpectRollback()

	err := s.repo.DeleteQuestion(context.Background(), qID)
	s.Require().Error(err)
}

func (s *QuestionRepositorySuite) TestCreateQuestionsInBatch() {
	formID := uuid.New()
	questions := []*model.Question{
		{ID: uuid.New(), FormID: formID, QuestionText: "Q1", Type: model.QuestionTypeBasic, Position: 1, CreatedAt: time.Now()},
		{ID: uuid.New(), FormID: formID, QuestionText: "Q2", Type: model.QuestionTypeMultipleChoice, Position: 2, Choices: model.JSONStringArray{"C", "D"}, CreatedAt: time.Now()},
	}

	s.mock.ExpectBegin()

	qStmtSQL := `INSERT INTO questions (id, form_id, question_text, type, position, required, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	mcqStmtSQL := `INSERT INTO multiple_choice_questions (id, question_id, choices, allow_multiple) VALUES ($1, $2, $3, $4)`

	s.mock.ExpectPrepare(regexp.QuoteMeta(qStmtSQL))
	s.mock.ExpectPrepare(regexp.QuoteMeta(mcqStmtSQL))

	for _, q := range questions {
		s.mock.ExpectExec(regexp.QuoteMeta(qStmtSQL)).
			WithArgs(q.ID, q.FormID, q.QuestionText, q.Type, q.Position, q.Required, q.CreatedAt).
			WillReturnResult(sqlmock.NewResult(1, 1))

		if q.Type == model.QuestionTypeMultipleChoice {
			s.mock.ExpectExec(regexp.QuoteMeta(mcqStmtSQL)).
				WithArgs(sqlmock.AnyArg(), q.ID, q.Choices, q.AllowMultiple).
				WillReturnResult(sqlmock.NewResult(1, 1))
		}
	}

	s.mock.ExpectCommit()

	err := s.repo.CreateQuestionsInBatch(context.Background(), questions)
	s.Require().NoError(err)
}

func (s *QuestionRepositorySuite) TestCreateQuestionsInBatch_TransactionFailure() {
	questions := []*model.Question{
		{ID: uuid.New(), Type: model.QuestionTypeBasic},
		{ID: uuid.New(), Type: model.QuestionTypeBasic}, // This one will fail
	}

	s.mock.ExpectBegin()
	s.mock.ExpectPrepare(`INSERT INTO questions`)
	s.mock.ExpectPrepare(`INSERT INTO multiple_choice_questions`)

	// First question succeeds
	s.mock.ExpectExec(`INSERT INTO questions`).WillReturnResult(sqlmock.NewResult(1, 1))
	// Second question fails
	s.mock.ExpectExec(`INSERT INTO questions`).WillReturnError(sql.ErrConnDone)

	s.mock.ExpectRollback()

	err := s.repo.CreateQuestionsInBatch(context.Background(), questions)
	s.Require().Error(err)
}
