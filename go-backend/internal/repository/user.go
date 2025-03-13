package repository

import (
	"database/sql"
	"fmt"

	"anoq/internal/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

func (r *UserRepository) Create(user *models.UserInput) (*models.User, error) {
	query := `
INSERT INTO users (email, username, family_name, given_name)
VALUES ($1, $2, $3, $4)
RETURNING id, email, username, family_name, given_name, created_at`

	createdUser := &models.User{}
	err := r.db.QueryRow(
		query,
		user.Email,
		user.Username,
		user.FamilyName,
		user.GivenName,
	).Scan(
		&createdUser.ID,
		&createdUser.Email,
		&createdUser.Username,
		&createdUser.FamilyName,
		&createdUser.GivenName,
		&createdUser.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("error creating user: %w", err)
	}

	return createdUser, nil
}

func (r *UserRepository) GetByID(id int) (*models.User, error) {
	query := `
SELECT id, email, username, family_name, given_name, created_at
FROM users
WHERE id = $1`

	user := &models.User{}
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.FamilyName,
		&user.GivenName,
		&user.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error getting user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	query := `
SELECT id, email, username, family_name, given_name, created_at
FROM users
WHERE email = $1`

	user := &models.User{}
	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.FamilyName,
		&user.GivenName,
		&user.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error getting user by email: %w", err)
	}

	return user, nil
}

func (r *UserRepository) Update(id int, user *models.UserInput) (*models.User, error) {
	query := `
UPDATE users
SET email = $1, username = $2, family_name = $3, given_name = $4
WHERE id = $5
RETURNING id, email, username, family_name, given_name, created_at`

	updatedUser := &models.User{}
	err := r.db.QueryRow(
		query,
		user.Email,
		user.Username,
		user.FamilyName,
		user.GivenName,
		id,
	).Scan(
		&updatedUser.ID,
		&updatedUser.Email,
		&updatedUser.Username,
		&updatedUser.FamilyName,
		&updatedUser.GivenName,
		&updatedUser.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error updating user: %w", err)
	}

	return updatedUser, nil
}

func (r *UserRepository) Delete(id int) error {
	query := "DELETE FROM users WHERE id = $1"
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error deleting user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return nil
	}

	return nil
}
