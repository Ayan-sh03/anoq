package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"

	"github.com/ayan-sh03/anoq/internal/model"
)

// CreateResponse creates a new response with all individual question answers
func (r *ResponseRepository) CreateResponse(ctx context.Context, response *model.FilledForm, answers []model.CreateAnswerRequest) error {
	// Start transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert filled form
	query := `
		INSERT INTO filled_forms (id, form_id, name, email, user_ip, created_at, modified_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err = tx.ExecContext(ctx, query,
		response.ID,
		response.FormID,
		response.Name,
		response.Email,
		response.UserIP,
		response.CreatedAt,
		response.ModifiedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create response: %w", err)
	}

	// Insert individual question answers
	if len(answers) > 0 {
		for _, answerReq := range answers {
			answer := &model.FilledFormQuestion{}
			answer.FromCreateRequest(&answerReq, response.ID)

			answerQuery := `
				INSERT INTO filled_form_questions (id, filled_form_id, question_id, answer, selected_choices, created_at)
				VALUES ($1, $2, $3, $4, $5, $6)`

			_, err = tx.ExecContext(ctx, answerQuery,
				answer.ID,
				answer.FilledFormID,
				answer.QuestionID,
				answer.Answer,
				answer.SelectedChoices,
				answer.CreatedAt,
			)

			if err != nil {
				return fmt.Errorf("failed to create answer for question %s: %w", answerReq.QuestionID, err)
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetResponseByID retrieves a response by ID with all its answers
func (r *ResponseRepository) GetResponseByID(ctx context.Context, id uuid.UUID) (*model.FilledForm, error) {
	query := `
		SELECT id, form_id, name, email, user_ip, created_at, modified_at
		FROM filled_forms
		WHERE id = $1`

	var response model.FilledForm
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&response.ID,
		&response.FormID,
		&response.Name,
		&response.Email,
		&response.UserIP,
		&response.CreatedAt,
		&response.ModifiedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("response not found")
		}
		return nil, fmt.Errorf("failed to get response: %w", err)
	}

	// Get answers for this response
	answers, err := r.getAnswersByFilledFormID(ctx, response.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get answers: %w", err)
	}
	response.Answers = answers

	return &response, nil
}

// GetResponsesByFormID retrieves all responses for a form with their answers
func (r *ResponseRepository) GetResponsesByFormID(ctx context.Context, formID uuid.UUID) ([]*model.FilledForm, error) {
	query := `
		SELECT id, form_id, name, email, user_ip, created_at, modified_at
		FROM filled_forms
		WHERE form_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, formID)
	if err != nil {
		return nil, fmt.Errorf("failed to get responses: %w", err)
	}
	defer rows.Close()

	var responses []*model.FilledForm
	for rows.Next() {
		var response model.FilledForm
		err := rows.Scan(
			&response.ID,
			&response.FormID,
			&response.Name,
			&response.Email,
			&response.UserIP,
			&response.CreatedAt,
			&response.ModifiedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan response: %w", err)
		}

		// Get answers for this response
		answers, err := r.getAnswersByFilledFormID(ctx, response.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get answers for response %s: %w", response.ID, err)
		}
		response.Answers = answers

		responses = append(responses, &response)
	}

	return responses, nil
}

// GetResponsesListByFormID retrieves responses for a form without answers (for listing)
func (r *ResponseRepository) GetResponsesListByFormID(ctx context.Context, formID uuid.UUID) ([]*model.FilledForm, error) {
	query := `
		SELECT id, form_id, name, email, user_ip, created_at, modified_at
		FROM filled_forms
		WHERE form_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, formID)
	if err != nil {
		return nil, fmt.Errorf("failed to get responses: %w", err)
	}
	defer rows.Close()

	var responses []*model.FilledForm
	for rows.Next() {
		var response model.FilledForm
		err := rows.Scan(
			&response.ID,
			&response.FormID,
			&response.Name,
			&response.Email,
			&response.UserIP,
			&response.CreatedAt,
			&response.ModifiedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan response: %w", err)
		}

		responses = append(responses, &response)
	}

	return responses, nil
}

// getAnswersByFilledFormID retrieves all answers for a filled form
func (r *ResponseRepository) getAnswersByFilledFormID(ctx context.Context, filledFormID uuid.UUID) ([]model.FilledFormQuestion, error) {
	query := `
		SELECT ffq.id, ffq.filled_form_id, ffq.question_id, ffq.answer, ffq.selected_choices, ffq.created_at,
		       q.id, q.form_id, q.question_text, q.answer, q.type, q.position, q.required, q.created_at,
		       mc.choices, mc.allow_multiple
		FROM filled_form_questions ffq
		INNER JOIN questions q ON ffq.question_id = q.id
		LEFT JOIN multiple_choice_questions mc ON q.id = mc.question_id
		WHERE ffq.filled_form_id = $1
		ORDER BY q.position`

	rows, err := r.db.QueryContext(ctx, query, filledFormID)
	if err != nil {
		return nil, fmt.Errorf("failed to get answers: %w", err)
	}
	defer rows.Close()

	var answers []model.FilledFormQuestion
	for rows.Next() {
		var answer model.FilledFormQuestion
		var question model.Question
		var choices sql.NullString
		var allowMultiple sql.NullBool

		err := rows.Scan(
			&answer.ID,
			&answer.FilledFormID,
			&answer.QuestionID,
			&answer.Answer,
			&answer.SelectedChoices,
			&answer.CreatedAt,
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
			return nil, fmt.Errorf("failed to scan answer: %w", err)
		}

		// Handle multiple choice fields for question
		if question.Type == model.QuestionTypeMultipleChoice {
			if choices.Valid {
				if err := question.Choices.Scan([]byte(choices.String)); err != nil {
					return nil, fmt.Errorf("failed to parse question choices: %w", err)
				}
			}
			question.AllowMultiple = allowMultiple.Bool
		}

		answer.Question = &question
		answers = append(answers, answer)
	}

	return answers, nil
}

// UpdateResponse updates a response and its answers
func (r *ResponseRepository) UpdateResponse(ctx context.Context, response *model.FilledForm, answers []model.UpdateAnswerRequest) error {
	// Start transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Update filled form
	query := `
		UPDATE filled_forms 
		SET name = $1, email = $2, modified_at = $3
		WHERE id = $4`

	result, err := tx.ExecContext(ctx, query,
		response.Name,
		response.Email,
		response.ModifiedAt,
		response.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update response: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("response not found")
	}

	// Update individual answers
	for _, answerReq := range answers {
		if answerReq.ID != nil {
			// Update existing answer
			updateQuery := `
				UPDATE filled_form_questions 
				SET question_id = $1, answer = $2, selected_choices = $3
				WHERE id = $4 AND filled_form_id = $5`

			selectedChoices := model.JSONStringArray(answerReq.SelectedChoices)
			_, err = tx.ExecContext(ctx, updateQuery,
				answerReq.QuestionID,
				answerReq.Answer,
				selectedChoices,
				*answerReq.ID,
				response.ID,
			)

			if err != nil {
				return fmt.Errorf("failed to update answer %s: %w", *answerReq.ID, err)
			}
		} else {
			// Create new answer
			answer := &model.FilledFormQuestion{}
			createReq := model.CreateAnswerRequest{
				QuestionID:      answerReq.QuestionID,
				Answer:          answerReq.Answer,
				SelectedChoices: answerReq.SelectedChoices,
			}
			answer.FromCreateRequest(&createReq, response.ID)

			insertQuery := `
				INSERT INTO filled_form_questions (id, filled_form_id, question_id, answer, selected_choices, created_at)
				VALUES ($1, $2, $3, $4, $5, $6)`

			_, err = tx.ExecContext(ctx, insertQuery,
				answer.ID,
				answer.FilledFormID,
				answer.QuestionID,
				answer.Answer,
				answer.SelectedChoices,
				answer.CreatedAt,
			)

			if err != nil {
				return fmt.Errorf("failed to create new answer for question %s: %w", answerReq.QuestionID, err)
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// DeleteResponse deletes a response and all its answers
func (r *ResponseRepository) DeleteResponse(ctx context.Context, responseID uuid.UUID) error {
	// Start transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete answers first
	deleteAnswersQuery := `DELETE FROM filled_form_questions WHERE filled_form_id = $1`
	_, err = tx.ExecContext(ctx, deleteAnswersQuery, responseID)
	if err != nil {
		return fmt.Errorf("failed to delete answers: %w", err)
	}

	// Delete response
	deleteResponseQuery := `DELETE FROM filled_forms WHERE id = $1`
	result, err := tx.ExecContext(ctx, deleteResponseQuery, responseID)
	if err != nil {
		return fmt.Errorf("failed to delete response: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("response not found")
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetFormSubmissionStats gets statistics for a form's submissions
func (r *ResponseRepository) GetFormSubmissionStats(ctx context.Context, formID uuid.UUID) (*model.FormSubmissionStats, error) {
	query := `
		SELECT 
			COUNT(*) as total_submissions,
			COUNT(DISTINCT email) as unique_emails,
			MAX(created_at) as last_submission
		FROM filled_forms 
		WHERE form_id = $1`

	var stats model.FormSubmissionStats
	var lastSubmission sql.NullTime

	err := r.db.QueryRowContext(ctx, query, formID).Scan(
		&stats.TotalSubmissions,
		&stats.UniqueEmails,
		&lastSubmission,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get submission stats: %w", err)
	}

	stats.FormID = formID
	if lastSubmission.Valid {
		stats.LastSubmission = &lastSubmission.Time
	}

	// Calculate average completion time (placeholder for now)
	stats.AverageTime = 0.0

	return &stats, nil
}
