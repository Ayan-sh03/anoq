package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"

	"github.com/ayan-sh03/anoq/internal/model"
)

// CreateQuestion creates a new question
func (r *QuestionRepository) CreateQuestion(ctx context.Context, question *model.Question) error {
	query := `
		INSERT INTO questions (id, form_id, question_text, answer, type, position, required, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := r.db.ExecContext(ctx, query,
		question.ID,
		question.FormID,
		question.QuestionText,
		question.Answer,
		question.Type,
		question.Position,
		question.Required,
		question.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create question: %w", err)
	}

	// If it's a multiple choice question, create the multiple choice entry
	if question.Type == model.QuestionTypeMultipleChoice {
		if err := r.createMultipleChoiceQuestion(ctx, question); err != nil {
			return fmt.Errorf("failed to create multiple choice question: %w", err)
		}
	}

	return nil
}

// createMultipleChoiceQuestion creates a multiple choice question entry
func (r *QuestionRepository) createMultipleChoiceQuestion(ctx context.Context, question *model.Question) error {
	query := `
		INSERT INTO multiple_choice_questions (id, question_id, choices, allow_multiple)
		VALUES ($1, $2, $3, $4)`

	_, err := r.db.ExecContext(ctx, query,
		uuid.New(),
		question.ID,
		question.Choices,
		question.AllowMultiple,
	)

	return err
}

// GetQuestionByID retrieves a question by ID
func (r *QuestionRepository) GetQuestionByID(ctx context.Context, questionID uuid.UUID) (*model.Question, error) {
	query := `
		SELECT q.id, q.form_id, q.question_text, q.answer, q.type, q.position, q.required, q.created_at,
		       mc.choices, mc.allow_multiple
		FROM questions q
		LEFT JOIN multiple_choice_questions mc ON q.id = mc.question_id
		WHERE q.id = $1`

	question := &model.Question{}
	var choices sql.NullString
	var allowMultiple sql.NullBool

	err := r.db.QueryRowContext(ctx, query, questionID).Scan(
		&question.ID,
		&question.FormID,
		&question.QuestionText,
		&question.Answer,
		&question.Type,
		&question.Position,
		&question.Required,
		&question.CreatedAt,
		&choices,
		&allowMultiple,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("question not found")
		}
		return nil, fmt.Errorf("failed to get question: %w", err)
	}

	// Handle multiple choice fields
	if question.Type == model.QuestionTypeMultipleChoice {
		if choices.Valid {
			if err := question.Choices.Scan([]byte(choices.String)); err != nil {
				return nil, fmt.Errorf("failed to parse choices: %w", err)
			}
		}
		question.AllowMultiple = allowMultiple.Bool
	}

	return question, nil
}

// GetQuestionsByFormID retrieves all questions for a form
func (r *QuestionRepository) GetQuestionsByFormID(ctx context.Context, formID uuid.UUID) ([]*model.Question, error) {
	query := `
		SELECT q.id, q.form_id, q.question_text, q.answer, q.type, q.position, q.required, q.created_at,
		       mc.choices, mc.allow_multiple
		FROM questions q
		LEFT JOIN multiple_choice_questions mc ON q.id = mc.question_id
		WHERE q.form_id = $1
		ORDER BY q.position`

	rows, err := r.db.QueryContext(ctx, query, formID)
	if err != nil {
		return nil, fmt.Errorf("failed to get questions: %w", err)
	}
	defer rows.Close()

	var questions []*model.Question
	for rows.Next() {
		question := &model.Question{}
		var choices sql.NullString
		var allowMultiple sql.NullBool

		err := rows.Scan(
			&question.ID,
			&question.FormID,
			&question.QuestionText,
			&question.Answer,
			&question.Type,
			&question.Position,
			&question.Required,
			&question.CreatedAt,
			&choices,
			&allowMultiple,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan question: %w", err)
		}

		// Handle multiple choice fields
		if question.Type == model.QuestionTypeMultipleChoice {
			if choices.Valid {
				if err := question.Choices.Scan([]byte(choices.String)); err != nil {
					return nil, fmt.Errorf("failed to parse choices: %w", err)
				}
			}
			question.AllowMultiple = allowMultiple.Bool
		}

		questions = append(questions, question)
	}

	return questions, nil
}

// UpdateQuestion updates an existing question
func (r *QuestionRepository) UpdateQuestion(ctx context.Context, question *model.Question) error {
	query := `
		UPDATE questions 
		SET question_text = $1, answer = $2, type = $3, position = $4, required = $5
		WHERE id = $6`

	result, err := r.db.ExecContext(ctx, query,
		question.QuestionText,
		question.Answer,
		question.Type,
		question.Position,
		question.Required,
		question.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update question: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("question not found")
	}

	// Handle multiple choice questions
	if question.Type == model.QuestionTypeMultipleChoice {
		if err := r.updateMultipleChoiceQuestion(ctx, question); err != nil {
			return fmt.Errorf("failed to update multiple choice question: %w", err)
		}
	}

	return nil
}

// updateMultipleChoiceQuestion updates multiple choice question data
func (r *QuestionRepository) updateMultipleChoiceQuestion(ctx context.Context, question *model.Question) error {
	// First, check if multiple choice entry exists
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM multiple_choice_questions WHERE question_id = $1)`
	err := r.db.QueryRowContext(ctx, checkQuery, question.ID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check multiple choice existence: %w", err)
	}

	if exists {
		// Update existing
		updateQuery := `
			UPDATE multiple_choice_questions 
			SET choices = $1, allow_multiple = $2
			WHERE question_id = $3`

		_, err := r.db.ExecContext(ctx, updateQuery,
			question.Choices,
			question.AllowMultiple,
			question.ID,
		)
		return err
	} else {
		// Create new
		return r.createMultipleChoiceQuestion(ctx, question)
	}
}

// DeleteQuestion deletes a question and its multiple choice data
func (r *QuestionRepository) DeleteQuestion(ctx context.Context, questionID uuid.UUID) error {
	// Start transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete multiple choice data first (if exists)
	deleteMultipleChoiceQuery := `DELETE FROM multiple_choice_questions WHERE question_id = $1`
	_, err = tx.ExecContext(ctx, deleteMultipleChoiceQuery, questionID)
	if err != nil {
		return fmt.Errorf("failed to delete multiple choice question: %w", err)
	}

	// Delete the question
	deleteQuestionQuery := `DELETE FROM questions WHERE id = $1`
	result, err := tx.ExecContext(ctx, deleteQuestionQuery, questionID)
	if err != nil {
		return fmt.Errorf("failed to delete question: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("question not found")
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// DeleteQuestionsByFormID deletes all questions for a form
func (r *QuestionRepository) DeleteQuestionsByFormID(ctx context.Context, formID uuid.UUID) error {
	// Start transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete multiple choice data first
	deleteMultipleChoiceQuery := `
		DELETE FROM multiple_choice_questions 
		WHERE question_id IN (SELECT id FROM questions WHERE form_id = $1)`
	_, err = tx.ExecContext(ctx, deleteMultipleChoiceQuery, formID)
	if err != nil {
		return fmt.Errorf("failed to delete multiple choice questions: %w", err)
	}

	// Delete questions
	deleteQuestionsQuery := `DELETE FROM questions WHERE form_id = $1`
	_, err = tx.ExecContext(ctx, deleteQuestionsQuery, formID)
	if err != nil {
		return fmt.Errorf("failed to delete questions: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// CreateQuestionsInBatch creates multiple questions in a single transaction
func (r *QuestionRepository) CreateQuestionsInBatch(ctx context.Context, questions []*model.Question) error {
	if len(questions) == 0 {
		return nil
	}

	// Start transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Prepare statements for reuse
	qStmt, err := tx.PrepareContext(ctx, `
		INSERT INTO questions (id, form_id, question_text, type, position, required, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`)
	if err != nil {
		return fmt.Errorf("failed to prepare question statement: %w", err)
	}
	defer qStmt.Close()

	mcqStmt, err := tx.PrepareContext(ctx, `
		INSERT INTO multiple_choice_questions (id, question_id, choices, allow_multiple)
		VALUES ($1, $2, $3, $4)`)
	if err != nil {
		return fmt.Errorf("failed to prepare multiple choice question statement: %w", err)
	}
	defer mcqStmt.Close()

	for _, q := range questions {
		// Use the prepared statements within the transaction
		if _, err := qStmt.ExecContext(ctx, q.ID, q.FormID, q.QuestionText, q.Type, q.Position, q.Required, q.CreatedAt); err != nil {
			return fmt.Errorf("failed to execute prepared statement for question %s: %w", q.ID, err)
		}

		if q.Type == model.QuestionTypeMultipleChoice {
			if _, err := mcqStmt.ExecContext(ctx, uuid.New(), q.ID, q.Choices, q.AllowMultiple); err != nil {
				return fmt.Errorf("failed to execute prepared statement for multiple choice question %s: %w", q.ID, err)
			}
		}
	}

	// Commit
	return tx.Commit()
}
