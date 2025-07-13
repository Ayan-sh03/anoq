package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ayan-sh03/anoq/internal/model"
	"github.com/ayan-sh03/anoq/internal/repository"
)

// QuestionHandler handles question-related HTTP requests
type QuestionHandler struct {
	questionRepo *repository.QuestionRepository
	formRepo     *repository.FormRepository
}

// NewQuestionHandler creates a new question handler
func NewQuestionHandler(questionRepo *repository.QuestionRepository, formRepo *repository.FormRepository) *QuestionHandler {
	return &QuestionHandler{
		questionRepo: questionRepo,
		formRepo:     formRepo,
	}
}

// CreateQuestion handles POST /api/form/:id/questions
// @Summary Create a question for a form
// @Description Add a new question to an existing form
// @Tags Questions
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "Form ID"
// @Param question body model.CreateQuestionRequest true "Question data"
// @Success 201 {object} object{message=string,question=model.QuestionResponse} "Question created successfully"
// @Failure 400 {object} object{error=string} "Invalid request body or form ID"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 403 {object} object{error=string} "Access denied: you don't own this form"
// @Failure 404 {object} object{error=string} "Form not found"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/form/{id}/questions [post]
func (h *QuestionHandler) CreateQuestion(c *gin.Context) {
	formIDStr := c.Param("id")
	formID, err := uuid.Parse(formIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form ID"})
		return
	}

	// Verify form exists and user owns it
	if err := h.verifyFormOwnership(c, formID); err != nil {
		return // Error response already sent
	}

	// Parse request body
	var createReq model.CreateQuestionRequest
	if err := c.ShouldBindJSON(&createReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate question type
	if createReq.Type != model.QuestionTypeBasic && createReq.Type != model.QuestionTypeMultipleChoice {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question type"})
		return
	}

	// Validate multiple choice questions
	if createReq.Type == model.QuestionTypeMultipleChoice {
		if len(createReq.Choices) < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Multiple choice questions must have at least 2 choices"})
			return
		}
	}

	// Create question model
	question := &model.Question{}
	question.FromCreateRequest(&createReq, formID)

	// Save question
	if err := h.questionRepo.CreateQuestion(c.Request.Context(), question); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Question created successfully",
		"question": question.ToResponse(),
	})
}

// GetQuestion handles GET /api/questions/:id
// @Summary Get a question by ID
// @Description Get details of a specific question
// @Tags Questions
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "Question ID"
// @Success 200 {object} object{question=model.QuestionResponse} "Question details"
// @Failure 400 {object} object{error=string} "Invalid question ID"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 403 {object} object{error=string} "Access denied: you don't own this form"
// @Failure 404 {object} object{error=string} "Question not found"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/questions/{id} [get]
func (h *QuestionHandler) GetQuestion(c *gin.Context) {
	questionIDStr := c.Param("id")
	questionID, err := uuid.Parse(questionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	question, err := h.questionRepo.GetQuestionByID(c.Request.Context(), questionID)
	if err != nil {
		if err.Error() == "question not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get question"})
		return
	}

	// Verify user owns the form (optional, for security)
	if err := h.verifyFormOwnership(c, question.FormID); err != nil {
		return // Error response already sent
	}

	c.JSON(http.StatusOK, gin.H{
		"question": question.ToResponse(),
	})
}

// GetFormQuestions handles GET /api/form/:id/questions
func (h *QuestionHandler) GetFormQuestions(c *gin.Context) {
	formIDStr := c.Param("id")
	formID, err := uuid.Parse(formIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form ID"})
		return
	}

	// Verify form exists and user owns it
	if err := h.verifyFormOwnership(c, formID); err != nil {
		return // Error response already sent
	}

	questions, err := h.questionRepo.GetQuestionsByFormID(c.Request.Context(), formID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get questions"})
		return
	}

	// Convert to response format
	questionResponses := make([]*model.QuestionResponse, len(questions))
	for i, question := range questions {
		questionResponses[i] = question.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": questionResponses,
		"count":     len(questionResponses),
	})
}

// UpdateQuestion handles PUT /api/questions/:id
func (h *QuestionHandler) UpdateQuestion(c *gin.Context) {
	questionIDStr := c.Param("id")
	questionID, err := uuid.Parse(questionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	// Get existing question
	question, err := h.questionRepo.GetQuestionByID(c.Request.Context(), questionID)
	if err != nil {
		if err.Error() == "question not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get question"})
		return
	}

	// Verify user owns the form
	if err := h.verifyFormOwnership(c, question.FormID); err != nil {
		return // Error response already sent
	}

	// Parse request body
	var updateReq model.UpdateQuestionRequest
	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate question type if provided
	if updateReq.Type != nil {
		if *updateReq.Type != model.QuestionTypeBasic && *updateReq.Type != model.QuestionTypeMultipleChoice {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question type"})
			return
		}
	}

	// Validate multiple choice questions
	if updateReq.Type != nil && *updateReq.Type == model.QuestionTypeMultipleChoice {
		if len(updateReq.Choices) < 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Multiple choice questions must have at least 2 choices"})
			return
		}
	}

	// Update question
	question.UpdateFromRequest(&updateReq)

	// Save updated question
	if err := h.questionRepo.UpdateQuestion(c.Request.Context(), question); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Question updated successfully",
		"question": question.ToResponse(),
	})
}

// DeleteQuestion handles DELETE /api/questions/:id
func (h *QuestionHandler) DeleteQuestion(c *gin.Context) {
	questionIDStr := c.Param("id")
	questionID, err := uuid.Parse(questionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	// Get existing question to verify ownership
	question, err := h.questionRepo.GetQuestionByID(c.Request.Context(), questionID)
	if err != nil {
		if err.Error() == "question not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get question"})
		return
	}

	// Verify user owns the form
	if err := h.verifyFormOwnership(c, question.FormID); err != nil {
		return // Error response already sent
	}

	// Delete question
	if err := h.questionRepo.DeleteQuestion(c.Request.Context(), questionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Question deleted successfully",
	})
}

// CreateMultipleQuestions handles POST /api/form/:id/questions/batch
func (h *QuestionHandler) CreateMultipleQuestions(c *gin.Context) {
	formIDStr := c.Param("id")
	formID, err := uuid.Parse(formIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form ID"})
		return
	}

	// Verify form exists and user owns it
	if err := h.verifyFormOwnership(c, formID); err != nil {
		return // Error response already sent
	}

	// Parse request body
	var batchReq struct {
		Questions []model.CreateQuestionRequest `json:"questions" binding:"required"`
	}
	if err := c.ShouldBindJSON(&batchReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if len(batchReq.Questions) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No questions provided"})
		return
	}

	// Validate and create question models
	questions := make([]*model.Question, len(batchReq.Questions))
	for i, createReq := range batchReq.Questions {
		// Validate question type
		if createReq.Type != model.QuestionTypeBasic && createReq.Type != model.QuestionTypeMultipleChoice {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid question type at index " + strconv.Itoa(i),
			})
			return
		}

		// Validate multiple choice questions
		if createReq.Type == model.QuestionTypeMultipleChoice {
			if len(createReq.Choices) < 2 {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Multiple choice question at index " + strconv.Itoa(i) + " must have at least 2 choices",
				})
				return
			}
		}

		// Create question model
		question := &model.Question{}
		question.FromCreateRequest(&createReq, formID)
		questions[i] = question
	}

	// Save questions in batch
	if err := h.questionRepo.CreateQuestionsInBatch(c.Request.Context(), questions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create questions"})
		return
	}

	// Convert to response format
	questionResponses := make([]*model.QuestionResponse, len(questions))
	for i, question := range questions {
		questionResponses[i] = question.ToResponse()
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Questions created successfully",
		"questions": questionResponses,
		"count":     len(questionResponses),
	})
}

// ReorderQuestions handles PUT /api/form/:id/questions/reorder
func (h *QuestionHandler) ReorderQuestions(c *gin.Context) {
	formIDStr := c.Param("id")
	formID, err := uuid.Parse(formIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form ID"})
		return
	}

	// Verify form exists and user owns it
	if err := h.verifyFormOwnership(c, formID); err != nil {
		return // Error response already sent
	}

	// Parse request body
	var reorderReq struct {
		QuestionOrders []struct {
			ID       uuid.UUID `json:"id" binding:"required"`
			Position int       `json:"position" binding:"required"`
		} `json:"question_orders" binding:"required"`
	}
	if err := c.ShouldBindJSON(&reorderReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Update each question's position
	for _, order := range reorderReq.QuestionOrders {
		question, err := h.questionRepo.GetQuestionByID(c.Request.Context(), order.ID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Question not found: " + order.ID.String(),
			})
			return
		}

		// Verify question belongs to the form
		if question.FormID != formID {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Question does not belong to this form: " + order.ID.String(),
			})
			return
		}

		// Update position
		question.Position = order.Position
		if err := h.questionRepo.UpdateQuestion(c.Request.Context(), question); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to update question position: " + order.ID.String(),
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Questions reordered successfully",
	})
}

// verifyFormOwnership checks if the authenticated user owns the form
func (h *QuestionHandler) verifyFormOwnership(c *gin.Context, formID uuid.UUID) error {
	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return gin.Error{Err: nil}
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return err
	}

	// Check if form exists and user owns it
	form, err := h.formRepo.GetFormByID(c.Request.Context(), formID)
	if err != nil {
		if err.Error() == "form not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return err
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form"})
		return err
	}

	if form.AuthorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: you don't own this form"})
		return gin.Error{Err: nil}
	}

	return nil
}
