package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/ayan-sh03/anoq/internal/db"
	"github.com/ayan-sh03/anoq/internal/model"
)

// CreateForm creates a new form
func (r *FormRepository) CreateForm(ctx context.Context, form *model.Form) error {
	query := `
		INSERT INTO forms (id, title, description, slug, author_id, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := r.db.ExecContext(ctx, query,
		form.ID,
		form.Title,
		form.Description,
		form.Slug,
		form.AuthorID, //author_id
		form.Status,
		form.CreatedAt,
		form.UpdatedAt,
	)

	if err != nil {
		if db.IsUniqueViolation(err) {
			return fmt.Errorf("form with slug %s already exists", form.Slug)
		}
		return fmt.Errorf("failed to create form: %w", err)
	}

	return nil
}

// GetFormByID retrieves a form by ID
func (r *FormRepository) GetFormByID(ctx context.Context, id uuid.UUID) (*model.Form, error) {
	query := `
		SELECT id, title, description, slug, author_id, status, created_at, updated_at
		FROM forms
		WHERE id = $1`

	var form model.Form
	err := r.db.GetContext(ctx, &form, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("form not found")
		}
		return nil, fmt.Errorf("failed to get form: %w", err)
	}

	return &form, nil
}

// GetFormBySlug retrieves a form by slug
func (r *FormRepository) GetFormBySlug(ctx context.Context, slug string) (*model.Form, error) {
	query := `
		SELECT id, title, description, slug, author_id, status, created_at, updated_at
		FROM forms
		WHERE slug = $1`

	var form model.Form
	err := r.db.GetContext(ctx, &form, query, slug)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("form not found")
		}
		return nil, fmt.Errorf("failed to get form: %w", err)
	}

	return &form, nil
}

// ListFormsByUserID retrieves all forms for a user
func (r *FormRepository) ListFormsByUserID(ctx context.Context, userID uuid.UUID) ([]*model.Form, error) {
	query := `
		SELECT id, title, description, slug, author_id, status, created_at, updated_at
		FROM forms
		WHERE author_id = $1
		ORDER BY created_at DESC`

	var forms []*model.Form
	err := r.db.SelectContext(ctx, &forms, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list forms: %w", err)
	}

	return forms, nil
}

// UpdateForm updates a form
func (r *FormRepository) UpdateForm(ctx context.Context, form *model.Form) error {
	query := `
		UPDATE forms
		SET title = $2, description = $3, status = $4, updated_at = $5
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query,
		form.ID,
		form.Title,
		form.Description,
		form.Status,
		form.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update form: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("form not found")
	}

	return nil
}

// DeleteForm deletes a form
func (r *FormRepository) DeleteForm(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM forms WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete form: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("form not found")
	}

	return nil
}

// UpdateFormStatus updates form status
func (r *FormRepository) UpdateFormStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `
		UPDATE forms
		SET status = $2, updated_at = $3
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id, status, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update form status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("form not found")
	}

	return nil
}

// GetDashboardStats retrieves dashboard statistics
func (r *FormRepository) GetDashboardStats(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Get total forms count
	var totalForms int
	err := r.db.GetContext(ctx, &totalForms, "SELECT COUNT(*) FROM forms WHERE author_id = $1", userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get total forms: %w", err)
	}

	// Get total responses count
	var totalResponses int
	err = r.db.GetContext(ctx, &totalResponses, `
		SELECT COUNT(*)
		FROM filled_forms ff
		JOIN forms f ON ff.form_id = f.id
		WHERE f.author_id = $1`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get total responses: %w", err)
	}

	// Get active forms count
	var activeForms int
	err = r.db.GetContext(ctx, &activeForms, "SELECT COUNT(*) FROM forms WHERE author_id = $1 AND status = 'open'", userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get active forms: %w", err)
	}

	stats["totalForms"] = totalForms
	stats["totalResponses"] = totalResponses
	stats["activeForms"] = activeForms

	return stats, nil
}
