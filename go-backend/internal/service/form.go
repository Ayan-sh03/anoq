package service

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"

	"anoq/internal/models"
	"anoq/internal/repository"
)

type FormService struct {
	repo     *repository.FormRepository
	userRepo *repository.UserRepository
}

func NewFormService(repo *repository.FormRepository, userRepo *repository.UserRepository) *FormService {
	return &FormService{
		repo:     repo,
		userRepo: userRepo,
	}
}

func (s *FormService) generateSlug() (string, error) {
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("error generating random bytes: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes)[:6], nil
}

func (s *FormService) CreateForm(authorEmail string, input *models.FormInput) (*models.Form, error) {
	// Get author
	author, err := s.userRepo.GetByEmail(authorEmail)
	if err != nil {
		return nil, fmt.Errorf("error getting author: %w", err)
	}
	if author == nil {
		return nil, fmt.Errorf("author not found")
	}

	log.Println("Author found:", author.Email)

	// Generate unique slug
	var slug string
	for i := 0; i < 5; i++ { // Try 5 times to generate a unique slug
		slug, err = s.generateSlug()
		if err != nil {
			return nil, fmt.Errorf("error generating slug: %w", err)
		}

		// Check if slug exists
		existingForm, err := s.repo.GetBySlug(slug)
		if err != nil {
			return nil, fmt.Errorf("error checking slug: %w", err)
		}
		if existingForm == nil {
			break // Unique slug found
		}

		if i == 4 {
			return nil, fmt.Errorf("failed to generate unique slug")
		}
	}
	log.Println("Generated slug:", slug)

	// Create form
	form, err := s.repo.Create(input, author.ID, slug)
	if err != nil {
		return nil, fmt.Errorf("error creating form: %w", err)
	}
	log.Println("Form created:", form.ID)

	return form, nil
}

func (s *FormService) GetForm(slug string) (*models.Form, error) {
	form, err := s.repo.GetBySlug(slug)
	if err != nil {
		return nil, fmt.Errorf("error getting form: %w", err)
	}
	if form == nil {
		return nil, fmt.Errorf("form not found")
	}

	return form, nil
}

func (s *FormService) UpdateForm(slug string, authorEmail string, input *models.FormInput) (*models.Form, error) {
	// Get author
	author, err := s.userRepo.GetByEmail(authorEmail)
	if err != nil {
		return nil, fmt.Errorf("error getting author: %w", err)
	}
	if author == nil {
		return nil, fmt.Errorf("author not found")
	}

	// Get form
	form, err := s.repo.GetBySlug(slug)
	if err != nil {
		return nil, fmt.Errorf("error getting form: %w", err)
	}
	if form == nil {
		return nil, fmt.Errorf("form not found")
	}

	// Check ownership
	if form.AuthorID != author.ID {
		return nil, fmt.Errorf("unauthorized: form belongs to another user")
	}

	// Update form
	updatedForm, err := s.repo.Update(form.ID, input)
	if err != nil {
		return nil, fmt.Errorf("error updating form: %w", err)
	}

	return updatedForm, nil
}

func (s *FormService) UpdateFormStatus(slug string, authorEmail string, status string) error {
	// Validate status
	if status != "open" && status != "closed" {
		return fmt.Errorf("invalid status: must be 'open' or 'closed'")
	}

	// Get author
	author, err := s.userRepo.GetByEmail(authorEmail)
	if err != nil {
		return fmt.Errorf("error getting author: %w", err)
	}
	if author == nil {
		return fmt.Errorf("author not found")
	}

	// Get form
	form, err := s.repo.GetBySlug(slug)
	if err != nil {
		return fmt.Errorf("error getting form: %w", err)
	}
	if form == nil {
		return fmt.Errorf("form not found")
	}

	// Check ownership
	if form.AuthorID != author.ID {
		return fmt.Errorf("unauthorized: form belongs to another user")
	}

	// Update status
	if err := s.repo.UpdateStatus(form.ID, status); err != nil {
		return fmt.Errorf("error updating form status: %w", err)
	}

	return nil
}

func (s *FormService) DeleteForm(slug string, authorEmail string) error {
	// Get author
	author, err := s.userRepo.GetByEmail(authorEmail)
	if err != nil {
		return fmt.Errorf("error getting author: %w", err)
	}
	if author == nil {
		return fmt.Errorf("author not found")
	}

	// Get form
	form, err := s.repo.GetBySlug(slug)
	if err != nil {
		return fmt.Errorf("error getting form: %w", err)
	}
	if form == nil {
		return fmt.Errorf("form not found")
	}

	// Check ownership
	if form.AuthorID != author.ID {
		return fmt.Errorf("unauthorized: form belongs to another user")
	}

	// Delete form
	if err := s.repo.Delete(form.ID); err != nil {
		return fmt.Errorf("error deleting form: %w", err)
	}

	return nil
}
