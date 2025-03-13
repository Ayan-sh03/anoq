package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"anoq/internal/models"
)

type FormRepository struct {
	db *sql.DB
}

func NewFormRepository(db *sql.DB) *FormRepository {
	return &FormRepository{
		db: db,
	}
}

func (r *FormRepository) Create(form *models.FormInput, authorID int, slug string) (*models.Form, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("error starting transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert form
	formQuery := `
INSERT INTO forms (title, description, slug, author_id, status)
VALUES ($1, $2, $3, $4, 'open')
RETURNING id, created_at, updated_at`

	var formID int
	var createdAt, updatedAt string
	err = tx.QueryRow(formQuery, form.Title, form.Description, slug, authorID).Scan(
		&formID,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("error creating form: %w", err)
	}

	// Insert questions
	for _, q := range form.Questions {
		questionQuery := `
INSERT INTO questions (question_text, type)
VALUES ($1, 'basic')
RETURNING id`

		var questionID int
		err = tx.QueryRow(questionQuery, q.QuestionText).Scan(&questionID)
		if err != nil {
			return nil, fmt.Errorf("error creating question: %w", err)
		}

		_, err = tx.Exec(
			"INSERT INTO form_questions (form_id, question_id) VALUES ($1, $2)",
			formID,
			questionID,
		)
		if err != nil {
			return nil, fmt.Errorf("error linking question to form: %w", err)
		}
	}

	// Insert choice questions
	for _, q := range form.ChoiceQuestions {
		choices, err := json.Marshal(q.Choices)
		if err != nil {
			return nil, fmt.Errorf("error marshaling choices: %w", err)
		}

		choiceQuery := `
INSERT INTO multiple_choice_questions (question_text, type, choices)
VALUES ($1, 'choice', $2)
RETURNING id`

		var questionID int
		err = tx.QueryRow(choiceQuery, q.QuestionText, choices).Scan(&questionID)
		if err != nil {
			return nil, fmt.Errorf("error creating choice question: %w", err)
		}

		_, err = tx.Exec(
			"INSERT INTO form_choice_questions (form_id, choice_question_id) VALUES ($1, $2)",
			formID,
			questionID,
		)
		if err != nil {
			return nil, fmt.Errorf("error linking choice question to form: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("error committing transaction: %w", err)
	}

	return r.GetByID(formID)
}

func (r *FormRepository) GetByID(id int) (*models.Form, error) {
	// Get form details
	form := &models.Form{}
	formQuery := `
SELECT f.id, f.title, f.description, f.slug, f.author_id, f.status, f.created_at, f.updated_at
FROM forms f
WHERE f.id = $1`

	err := r.db.QueryRow(formQuery, id).Scan(
		&form.ID,
		&form.Title,
		&form.Description,
		&form.Slug,
		&form.AuthorID,
		&form.Status,
		&form.CreatedAt,
		&form.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error getting form: %w", err)
	}

	// Get basic questions
	questionsQuery := `
SELECT q.id, q.question_text, q.type, q.created_at
FROM questions q
JOIN form_questions fq ON q.id = fq.question_id
WHERE fq.form_id = $1`

	rows, err := r.db.Query(questionsQuery, id)
	if err != nil {
		return nil, fmt.Errorf("error getting questions: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		q := models.Question{}
		err := rows.Scan(&q.ID, &q.QuestionText, &q.Type, &q.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("error scanning question: %w", err)
		}
		form.Questions = append(form.Questions, q)
	}

	// Get choice questions
	choiceQuery := `
SELECT mcq.id, mcq.question_text, mcq.type, mcq.choices, mcq.created_at
FROM multiple_choice_questions mcq
JOIN form_choice_questions fcq ON mcq.id = fcq.choice_question_id
WHERE fcq.form_id = $1`

	choiceRows, err := r.db.Query(choiceQuery, id)
	if err != nil {
		return nil, fmt.Errorf("error getting choice questions: %w", err)
	}
	defer choiceRows.Close()

	for choiceRows.Next() {
		q := models.MultipleChoiceQuestion{}
		var choicesJSON []byte
		err := choiceRows.Scan(&q.ID, &q.QuestionText, &q.Type, &choicesJSON, &q.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("error scanning choice question: %w", err)
		}

		if err := json.Unmarshal(choicesJSON, &q.Choices); err != nil {
			return nil, fmt.Errorf("error unmarshaling choices: %w", err)
		}

		form.ChoiceQuestions = append(form.ChoiceQuestions, q)
	}

	return form, nil
}

func (r *FormRepository) GetBySlug(slug string) (*models.Form, error) {
	query := "SELECT id FROM forms WHERE slug = $1"
	var id int
	err := r.db.QueryRow(query, slug).Scan(&id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error getting form by slug: %w", err)
	}

	return r.GetByID(id)
}

func (r *FormRepository) Update(id int, form *models.FormInput) (*models.Form, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("error starting transaction: %w", err)
	}
	defer tx.Rollback()

	// Update form basic info
	_, err = tx.Exec(
		"UPDATE forms SET title = $1, description = $2 WHERE id = $3",
		form.Title,
		form.Description,
		id,
	)
	if err != nil {
		return nil, fmt.Errorf("error updating form: %w", err)
	}

	// Delete existing questions
	_, err = tx.Exec("DELETE FROM form_questions WHERE form_id = $1", id)
	if err != nil {
		return nil, fmt.Errorf("error deleting questions: %w", err)
	}
	_, err = tx.Exec("DELETE FROM form_choice_questions WHERE form_id = $1", id)
	if err != nil {
		return nil, fmt.Errorf("error deleting choice questions: %w", err)
	}

	// Insert new questions
	for _, q := range form.Questions {
		questionQuery := `
INSERT INTO questions (question_text, type)
VALUES ($1, 'basic')
RETURNING id`

		var questionID int
		err = tx.QueryRow(questionQuery, q.QuestionText).Scan(&questionID)
		if err != nil {
			return nil, fmt.Errorf("error creating question: %w", err)
		}

		_, err = tx.Exec(
			"INSERT INTO form_questions (form_id, question_id) VALUES ($1, $2)",
			id,
			questionID,
		)
		if err != nil {
			return nil, fmt.Errorf("error linking question to form: %w", err)
		}
	}

	// Insert new choice questions
	for _, q := range form.ChoiceQuestions {
		choices, err := json.Marshal(q.Choices)
		if err != nil {
			return nil, fmt.Errorf("error marshaling choices: %w", err)
		}

		choiceQuery := `
INSERT INTO multiple_choice_questions (question_text, type, choices)
VALUES ($1, 'choice', $2)
RETURNING id`

		var questionID int
		err = tx.QueryRow(choiceQuery, q.QuestionText, choices).Scan(&questionID)
		if err != nil {
			return nil, fmt.Errorf("error creating choice question: %w", err)
		}

		_, err = tx.Exec(
			"INSERT INTO form_choice_questions (form_id, choice_question_id) VALUES ($1, $2)",
			id,
			questionID,
		)
		if err != nil {
			return nil, fmt.Errorf("error linking choice question to form: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("error committing transaction: %w", err)
	}

	return r.GetByID(id)
}

func (r *FormRepository) UpdateStatus(id int, status string) error {
	query := "UPDATE forms SET status = $1 WHERE id = $2"
	result, err := r.db.Exec(query, status, id)
	if err != nil {
		return fmt.Errorf("error updating form status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("form not found")
	}

	return nil
}

func (r *FormRepository) Delete(id int) error {
	query := "DELETE FROM forms WHERE id = $1"
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error deleting form: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("form not found")
	}

	return nil
}
