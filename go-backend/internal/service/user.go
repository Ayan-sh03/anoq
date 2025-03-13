package service

import (
	"fmt"

	"anoq/internal/models"
	"anoq/internal/repository"
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{
		repo: repo,
	}
}

func (s *UserService) CreateUser(input *models.UserInput) (*models.User, error) {
	// Check if user with email already exists
	existingUser, err := s.repo.GetByEmail(input.Email)
	if err != nil {
		return nil, fmt.Errorf("error checking existing user: %w", err)
	}
	if existingUser != nil {
		return nil, fmt.Errorf("user with email %s already exists", input.Email)
	}

	// Create user
	user, err := s.repo.Create(input)
	if err != nil {
		return nil, fmt.Errorf("error creating user: %w", err)
	}

	return user, nil
}

func (s *UserService) GetUser(id int) (*models.User, error) {
	user, err := s.repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("error getting user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	return user, nil
}

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		return nil, fmt.Errorf("error getting user by email: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	return user, nil
}

func (s *UserService) UpdateUser(id int, input *models.UserInput) (*models.User, error) {
	// Check if user exists
	existingUser, err := s.repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("error checking existing user: %w", err)
	}
	if existingUser == nil {
		return nil, fmt.Errorf("user not found")
	}

	// If email is being changed, check if new email is already taken
	if input.Email != existingUser.Email {
		userWithEmail, err := s.repo.GetByEmail(input.Email)
		if err != nil {
			return nil, fmt.Errorf("error checking email availability: %w", err)
		}
		if userWithEmail != nil {
			return nil, fmt.Errorf("email %s is already taken", input.Email)
		}
	}

	// Update user
	user, err := s.repo.Update(id, input)
	if err != nil {
		return nil, fmt.Errorf("error updating user: %w", err)
	}

	return user, nil
}

func (s *UserService) DeleteUser(id int) error {
	// Check if user exists
	existingUser, err := s.repo.GetByID(id)
	if err != nil {
		return fmt.Errorf("error checking existing user: %w", err)
	}
	if existingUser == nil {
		return fmt.Errorf("user not found")
	}

	// Delete user
	if err := s.repo.Delete(id); err != nil {
		return fmt.Errorf("error deleting user: %w", err)
	}

	return nil
}
