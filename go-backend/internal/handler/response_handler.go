package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ayan-sh03/anoq/internal/model"
	"github.com/ayan-sh03/anoq/internal/repository"
)

// ResponseHandler handles response-related HTTP requests
type ResponseHandler struct {
	responseRepo *repository.ResponseRepository
	formRepo     *repository.FormRepository
	questionRepo *repository.QuestionRepository
}

// NewResponseHandler creates a new response handler
func NewResponseHandler(responseRepo *repository.ResponseRepository, formRepo *repository.FormRepository, questionRepo *repository.QuestionRepository) *ResponseHandler {
	return &ResponseHandler{
		responseRepo: responseRepo,
		formRepo:     formRepo,
		questionRepo: questionRepo,
	}
}

// SubmitResponse handles POST /api/response
// @Summary Submit a form response
// @Description Submit answers to a form (public endpoint)
// @Tags Responses
// @Accept json
// @Produce json
// @Param response body model.CreateResponseRequest true "Form response data"
// @Success 201 {object} object{message=string,response_id=string} "Response submitted successfully"
// @Failure 400 {object} object{error=string} "Invalid request body or form not accepting responses"
// @Failure 404 {object} object{error=string} "Form not found"
// @Failure 429 {object} object{error=string} "Rate limit exceeded"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/response [post]
func (h *ResponseHandler) SubmitResponse(c *gin.Context) {
	// Parse request body using the proper model
	var submitReq model.CreateResponseRequest
	if err := c.ShouldBindJSON(&submitReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Check if form exists and is open
	form, err := h.formRepo.GetFormByID(c.Request.Context(), submitReq.FormID)
	if err != nil {
		if err.Error() == "form not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form"})
		return
	}

	if form.Status != model.FormStatusOpen {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Form is not accepting responses"})
		return
	}

	// Validate that all questions exist and belong to this form
	if len(submitReq.Answers) > 0 {
		// Get all questions for this form to validate against
		formQuestions, err := h.questionRepo.GetQuestionsByFormID(c.Request.Context(), submitReq.FormID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate questions"})
			return
		}

		// Create maps for validation
		validQuestionIDs := make(map[uuid.UUID]bool)
		questionsMap := make(map[uuid.UUID]*model.Question)
		for _, question := range formQuestions {
			validQuestionIDs[question.ID] = true
			questionsMap[question.ID] = question
		}

		// Validate each answer
		for _, answerReq := range submitReq.Answers {
			// Check if question exists and belongs to form
			if !validQuestionIDs[answerReq.QuestionID] {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Invalid question ID: " + answerReq.QuestionID.String(),
				})
				return
			}

			question := questionsMap[answerReq.QuestionID]

			// Validate multiple choice answers
			if question.IsMultipleChoice() && len(answerReq.SelectedChoices) > 0 {
				// Check if multiple selection is allowed
				if !question.AllowMultiple && len(answerReq.SelectedChoices) > 1 {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "Multiple selections not allowed for question: " + question.QuestionText,
					})
					return
				}

				// Validate that all selected choices are valid options
				validChoices := make(map[string]bool)
				for _, choice := range question.Choices {
					validChoices[choice] = true
				}

				for _, selectedChoice := range answerReq.SelectedChoices {
					if !validChoices[selectedChoice] {
						c.JSON(http.StatusBadRequest, gin.H{
							"error": "Invalid choice '" + selectedChoice + "' for question: " + question.QuestionText,
						})
						return
					}
				}
			}

			// Validate required questions have answers
			if question.Required {
				hasAnswer := false
				if answerReq.Answer != nil && *answerReq.Answer != "" {
					hasAnswer = true
				}
				if len(answerReq.SelectedChoices) > 0 {
					hasAnswer = true
				}

				if !hasAnswer {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "Answer required for question: " + question.QuestionText,
					})
					return
				}
			}
		}
	}

	// Get client IP
	userIP := c.ClientIP()

	// Create response model
	response := &model.FilledForm{}
	response.FromCreateRequest(&submitReq, userIP)

	// Save response with individual question answers
	if err := h.responseRepo.CreateResponse(c.Request.Context(), response, submitReq.Answers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit response"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Response submitted successfully",
		"response_id": response.ID,
	})
}

// GetResponse handles GET /api/response/:id
// @Summary Get a response by ID
// @Description Get details of a specific form response
// @Tags Responses
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "Response ID"
// @Success 200 {object} object{response=model.ResponseDetailResponse} "Response details"
// @Failure 400 {object} object{error=string} "Invalid response ID"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 404 {object} object{error=string} "Response not found"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/response/{id} [get]
func (h *ResponseHandler) GetResponse(c *gin.Context) {
	responseIDStr := c.Param("id")
	responseID, err := uuid.Parse(responseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid response ID"})
		return
	}

	response, err := h.responseRepo.GetResponseByID(c.Request.Context(), responseID)
	if err != nil {
		if err.Error() == "response not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Response not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get response"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response": response,
	})
}
