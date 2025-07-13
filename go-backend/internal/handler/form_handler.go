package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ayan-sh03/anoq/internal/model"
	"github.com/ayan-sh03/anoq/internal/repository"
)

// FormHandler handles form-related HTTP requests
type FormHandler struct {
	formRepo     *repository.FormRepository
	responseRepo *repository.ResponseRepository
}

// NewFormHandler creates a new form handler
func NewFormHandler(formRepo *repository.FormRepository, responseRepo *repository.ResponseRepository) *FormHandler {
	return &FormHandler{
		formRepo:     formRepo,
		responseRepo: responseRepo,
	}
}

// ListForms handles GET /api/form
// @Summary List user's forms
// @Description Get a list of forms created by the authenticated user
// @Tags Forms
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} object{forms=[]model.Form} "List of forms"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/form [get]
func (h *FormHandler) ListForms(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	forms, err := h.formRepo.ListFormsByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list forms"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"forms": forms,
	})
}

// GetForm handles GET /api/form/:id
func (h *FormHandler) GetForm(c *gin.Context) {

	formIdStr := c.Param("id")
	formId, err := uuid.Parse(formIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form ID"})
		return
	}

	form, err := h.formRepo.GetFormByID(c.Request.Context(), formId)
	if err != nil {
		if err.Error() == "form not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"form": form,
	})
}

// CreateForm handles POST /api/form
// @Summary Create a new form
// @Description Create a new form with title, description, and slug
// @Tags Forms
// @Accept json
// @Produce json
// @Security Bearer
// @Param form body model.CreateFormRequest true "Form creation data"
// @Success 201 {object} object{message=string,form=model.Form} "Form created successfully"
// @Failure 400 {object} object{error=string} "Invalid request body"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 409 {object} object{error=string} "Form with this slug already exists"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/form [post]
func (h *FormHandler) CreateForm(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse request body
	var createReq struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Slug        string `json:"slug" binding:"required"`
	}

	if err := c.ShouldBindJSON(&createReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Create form model
	form := &model.Form{
		ID:          uuid.New(),
		Title:       createReq.Title,
		Description: createReq.Description,
		Slug:        createReq.Slug,
		AuthorID:    userID,
		Status:      model.FormStatusOpen,
		CreatedAt:   time.Now(),
		ModifiedAt:  time.Now(),
	}
	//debug
	fmt.Println("Form: ", form)

	// Save form
	if err := h.formRepo.CreateForm(c.Request.Context(), form); err != nil {
		if err.Error() == "form with slug "+createReq.Slug+" already exists" {
			fmt.Println("Form with slug already exists")
			c.JSON(http.StatusConflict, gin.H{"error": "Form with this slug already exists"})
			return
		}
		fmt.Println("Error: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create form"})
		return

	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Form created successfully",
		"form":    form,
	})
}

// UpdateForm handles PUT /api/form/:id
// @Summary Update a form
// @Description Update an existing form's details
// @Tags Forms
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "Form ID"
// @Param form body model.UpdateFormRequest true "Form update data"
// @Success 200 {object} object{message=string,form=model.Form} "Form updated successfully"
// @Failure 400 {object} object{error=string} "Invalid request body or form ID"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 403 {object} object{error=string} "Access denied: you don't own this form"
// @Failure 404 {object} object{error=string} "Form not found"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/form/{id} [put]
func (h *FormHandler) UpdateForm(c *gin.Context) {
	formIDStr := c.Param("id")
	formID, err := uuid.Parse(formIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form ID"})
		return
	}

	// Parse request body
	var updateReq struct {
		Title       string           `json:"title"`
		Description string           `json:"description"`
		Status      model.FormStatus `json:"status"`
	}

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get existing form
	form, err := h.formRepo.GetFormByID(c.Request.Context(), formID)
	if err != nil {
		if err.Error() == "form not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form"})
		return
	}

	// Update form fields
	if updateReq.Title != "" {
		form.Title = updateReq.Title
	}
	if updateReq.Description != "" {
		form.Description = updateReq.Description
	}
	if updateReq.Status != "" {
		form.Status = updateReq.Status
	}
	form.ModifiedAt = time.Now()

	// Save updated form
	if err := h.formRepo.UpdateForm(c.Request.Context(), form); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update form"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Form updated successfully",
		"form":    form,
	})
}

// DeleteForm handles DELETE /api/form/:id
// @Summary Delete a form
// @Description Delete an existing form
// @Tags Forms
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "Form ID"
// @Success 200 {object} object{message=string} "Form deleted successfully"
// @Failure 400 {object} object{error=string} "Invalid form ID"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 404 {object} object{error=string} "Form not found"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/form/{id} [delete]
func (h *FormHandler) DeleteForm(c *gin.Context) {
	formIDStr := c.Param("id")
	formID, err := uuid.Parse(formIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form ID"})
		return
	}

	if err := h.formRepo.DeleteForm(c.Request.Context(), formID); err != nil {
		if err.Error() == "form not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete form"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Form deleted successfully",
	})
}

// OpenForm handles POST /api/form/open/:slug
func (h *FormHandler) OpenForm(c *gin.Context) {
	slug := c.Param("slug")

	form, err := h.formRepo.GetFormBySlug(c.Request.Context(), slug)
	if err != nil {
		if err.Error() == "form not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form"})
		return
	}

	if err := h.formRepo.UpdateFormStatus(c.Request.Context(), form.ID, "open"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open form"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Form opened successfully",
	})
}

// CloseForm handles POST /api/form/close/:slug
func (h *FormHandler) CloseForm(c *gin.Context) {
	slug := c.Param("slug")

	form, err := h.formRepo.GetFormBySlug(c.Request.Context(), slug)
	if err != nil {
		if err.Error() == "form not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form"})
		return
	}

	if err := h.formRepo.UpdateFormStatus(c.Request.Context(), form.ID, "closed"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to close form"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Form closed successfully",
	})
}

// GetFormSubmissions handles GET /api/form/submissions/:slug
func (h *FormHandler) GetFormSubmissions(c *gin.Context) {
	slug := c.Param("slug")

	form, err := h.formRepo.GetFormBySlug(c.Request.Context(), slug)
	if err != nil {
		if err.Error() == "form not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form"})
		return
	}

	// Check if user owns this form (for security)
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if form.AuthorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: you don't own this form"})
		return
	}

	// Get detailed query parameter to determine if we need full details or just list
	detailed := c.Query("detailed") == "true"

	if detailed {
		// Get responses with full details including answers
		responses, err := h.responseRepo.GetResponsesByFormID(c.Request.Context(), form.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form submissions"})
			return
		}

		// Convert to response format
		submissionDetails := make([]interface{}, len(responses))
		for i, response := range responses {
			submissionDetails[i] = response.ToDetailResponse()
		}

		c.JSON(http.StatusOK, gin.H{
			"form_id":     form.ID,
			"submissions": submissionDetails,
			"count":       len(submissionDetails),
		})
	} else {
		// Get responses list only (without answers for performance)
		responses, err := h.responseRepo.GetResponsesListByFormID(c.Request.Context(), form.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form submissions"})
			return
		}

		// Convert to list response format
		submissionList := make([]interface{}, len(responses))
		for i, response := range responses {
			submissionList[i] = response.ToResponseList()
		}

		c.JSON(http.StatusOK, gin.H{
			"form_id":     form.ID,
			"submissions": submissionList,
			"count":       len(submissionList),
		})
	}
}

// GetDashboard handles GET /api/dashboard
func (h *FormHandler) GetDashboard(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get recent forms
	forms, err := h.formRepo.ListFormsByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard data"})
		return
	}

	// Limit to recent 5 forms
	recentForms := forms
	if len(forms) > 5 {
		recentForms = forms[:5]
	}

	c.JSON(http.StatusOK, gin.H{
		"recent_forms": recentForms,
	})
}

// GetStats handles GET /api/dashboard/stats
func (h *FormHandler) GetStats(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	stats, err := h.formRepo.GetDashboardStats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetFormBySlug handles GET /api/form/slug/{slug}
// @Summary Get form by slug
// @Description Get a form by its slug identifier (public endpoint)
// @Tags Forms
// @Accept json
// @Produce json
// @Param slug path string true "Form slug"
// @Success 200 {object} object{form=model.Form} "Form details"
// @Failure 404 {object} object{error=string} "Form not found"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/form/slug/{slug} [get]
func (h *FormHandler) GetFormBySlug(c *gin.Context) {
	slug := c.Param("slug")

	form, err := h.formRepo.GetFormBySlug(c.Request.Context(), slug)
	if err != nil {
		if err.Error() == "form not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get form"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"form": form,
	})
}
