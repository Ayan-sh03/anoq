package service

import (
	"fmt"
	"net"

	"anoq/internal/models"
	"anoq/internal/repository"
)

type SubmissionService struct {
	repo     *repository.SubmissionRepository
	formRepo *repository.FormRepository
}

func NewSubmissionService(repo *repository.SubmissionRepository, formRepo *repository.FormRepository) *SubmissionService {
	return &SubmissionService{
		repo:     repo,
		formRepo: formRepo,
	}
}

func (s *SubmissionService) SubmitForm(slug string, input *models.FilledFormInput, ipAddress string) (*models.FilledForm, error) {
	// Get form
	form, err := s.formRepo.GetBySlug(slug)
	if err != nil {
		return nil, fmt.Errorf("error getting form: %w", err)
	}
	if form == nil {
		return nil, fmt.Errorf("form not found")
	}

	// Check if form is open
	if form.Status != "open" {
		return nil, fmt.Errorf("form is closed for submissions")
	}

	// Validate IP address
	if ipAddress != "" {
		if ip := net.ParseIP(ipAddress); ip == nil {
			return nil, fmt.Errorf("invalid IP address")
		}
	}

	// Validate answers (ensure all required questions are answered)
	questionMap := make(map[int]bool)
	choiceQuestionMap := make(map[int]bool)

	for _, q := range form.Questions {
		questionMap[q.ID] = true
	}
	for _, q := range form.ChoiceQuestions {
		choiceQuestionMap[q.ID] = true
	}

	for _, a := range input.Answers {
		if !questionMap[a.QuestionID] {
			return nil, fmt.Errorf("invalid question ID: %d", a.QuestionID)
		}
		delete(questionMap, a.QuestionID)
	}

	for _, a := range input.ChoiceAnswers {
		if !choiceQuestionMap[a.ChoiceQuestionID] {
			return nil, fmt.Errorf("invalid choice question ID: %d", a.ChoiceQuestionID)
		}
		delete(choiceQuestionMap, a.ChoiceQuestionID)
	}

	if len(questionMap) > 0 || len(choiceQuestionMap) > 0 {
		return nil, fmt.Errorf("not all questions were answered")
	}

	// Create submission
	submission, err := s.repo.Create(form.ID, input, ipAddress)
	if err != nil {
		return nil, fmt.Errorf("error creating submission: %w", err)
	}

	return submission, nil
}

func (s *SubmissionService) GetSubmission(id int) (*models.FilledForm, error) {
	submission, err := s.repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("error getting submission: %w", err)
	}
	if submission == nil {
		return nil, fmt.Errorf("submission not found")
	}

	return submission, nil
}

func (s *SubmissionService) GetFormSubmissions(slug string) ([]models.FilledForm, error) {
	// Get form
	form, err := s.formRepo.GetBySlug(slug)
	if err != nil {
		return nil, fmt.Errorf("error getting form: %w", err)
	}
	if form == nil {
		return nil, fmt.Errorf("form not found")
	}

	// Get submissions
	submissions, err := s.repo.GetFormSubmissions(form.ID)
	if err != nil {
		return nil, fmt.Errorf("error getting form submissions: %w", err)
	}

	return submissions, nil
}

func (s *SubmissionService) DeleteSubmission(id int) error {
	// Check if submission exists
	submission, err := s.repo.GetByID(id)
	if err != nil {
		return fmt.Errorf("error checking submission: %w", err)
	}
	if submission == nil {
		return fmt.Errorf("submission not found")
	}

	// Delete submission
	if err := s.repo.Delete(id); err != nil {
		return fmt.Errorf("error deleting submission: %w", err)
	}

	return nil
}
