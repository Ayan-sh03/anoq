package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"anoq/internal/models"
)

type SubmissionRepository struct {
	db *sql.DB
}

func NewSubmissionRepository(db *sql.DB) *SubmissionRepository {
	return &SubmissionRepository{
		db: db,
	}
}

func (r *SubmissionRepository) Create(formID int, submission *models.FilledFormInput, userIP string) (*models.FilledForm, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("error starting transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert filled form
	formQuery := `
INSERT INTO filled_forms (form_id, name, email, user_ip)
VALUES ($1, $2, $3, $4)
RETURNING id, submitted_at`

	var filledFormID int
	var submittedAt string
	err = tx.QueryRow(
		formQuery,
		formID,
		submission.Name,
		submission.Email,
		userIP,
	).Scan(&filledFormID, &submittedAt)
	if err != nil {
		return nil, fmt.Errorf("error creating filled form: %w", err)
	}

	// Insert basic answers
	for _, a := range submission.Answers {
		_, err = tx.Exec(
			"INSERT INTO filled_form_answers (filled_form_id, question_id, answer) VALUES ($1, $2, $3)",
			filledFormID,
			a.QuestionID,
			a.Answer,
		)
		if err != nil {
			return nil, fmt.Errorf("error saving answer: %w", err)
		}
	}

	// Insert choice answers
	for _, a := range submission.ChoiceAnswers {
		selectedChoices, err := json.Marshal(a.SelectedChoices)
		if err != nil {
			return nil, fmt.Errorf("error marshaling selected choices: %w", err)
		}

		_, err = tx.Exec(
			"INSERT INTO filled_form_choice_answers (filled_form_id, choice_question_id, selected_choices) VALUES ($1, $2, $3)",
			filledFormID,
			a.ChoiceQuestionID,
			selectedChoices,
		)
		if err != nil {
			return nil, fmt.Errorf("error saving choice answer: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("error committing transaction: %w", err)
	}

	return r.GetByID(filledFormID)
}

func (r *SubmissionRepository) GetByID(id int) (*models.FilledForm, error) {
	// Get filled form details
	filledForm := &models.FilledForm{}
	formQuery := `
SELECT f.id, f.form_id, f.name, f.email, f.user_ip, f.submitted_at
FROM filled_forms f
WHERE f.id = $1`

	err := r.db.QueryRow(formQuery, id).Scan(
		&filledForm.ID,
		&filledForm.FormID,
		&filledForm.Name,
		&filledForm.Email,
		&filledForm.UserIP,
		&filledForm.SubmittedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error getting filled form: %w", err)
	}

	// Get basic answers
	answersQuery := `
SELECT ffa.question_id, ffa.answer, ffa.created_at
FROM filled_form_answers ffa
WHERE ffa.filled_form_id = $1`

	rows, err := r.db.Query(answersQuery, id)
	if err != nil {
		return nil, fmt.Errorf("error getting answers: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		a := models.Answer{FilledFormID: id}
		err := rows.Scan(&a.QuestionID, &a.Answer, &a.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("error scanning answer: %w", err)
		}
		filledForm.Answers = append(filledForm.Answers, a)
	}

	// Get choice answers
	choiceQuery := `
SELECT ffca.choice_question_id, ffca.selected_choices, ffca.created_at
FROM filled_form_choice_answers ffca
WHERE ffca.filled_form_id = $1`

	choiceRows, err := r.db.Query(choiceQuery, id)
	if err != nil {
		return nil, fmt.Errorf("error getting choice answers: %w", err)
	}
	defer choiceRows.Close()

	for choiceRows.Next() {
		a := models.ChoiceAnswer{FilledFormID: id}
		var selectedChoicesJSON []byte
		err := choiceRows.Scan(&a.ChoiceQuestionID, &selectedChoicesJSON, &a.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("error scanning choice answer: %w", err)
		}

		if err := json.Unmarshal(selectedChoicesJSON, &a.SelectedChoices); err != nil {
			return nil, fmt.Errorf("error unmarshaling selected choices: %w", err)
		}

		filledForm.ChoiceAnswers = append(filledForm.ChoiceAnswers, a)
	}

	return filledForm, nil
}

func (r *SubmissionRepository) GetFormSubmissions(formID int) ([]models.FilledForm, error) {
	submissions := []models.FilledForm{}

	// Get all filled forms for a specific form
	formQuery := `
SELECT f.id
FROM filled_forms f
WHERE f.form_id = $1
ORDER BY f.submitted_at DESC`

	rows, err := r.db.Query(formQuery, formID)
	if err != nil {
		return nil, fmt.Errorf("error getting submissions: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		err := rows.Scan(&id)
		if err != nil {
			return nil, fmt.Errorf("error scanning submission ID: %w", err)
		}

		submission, err := r.GetByID(id)
		if err != nil {
			return nil, err
		}
		submissions = append(submissions, *submission)
	}

	return submissions, nil
}

func (r *SubmissionRepository) Delete(id int) error {
	query := "DELETE FROM filled_forms WHERE id = $1"
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error deleting submission: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("submission not found")
	}

	return nil
}
