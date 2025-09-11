package handlers

import (
	"net/http"
	"time"

	"anoq/internal/logger"
	"anoq/internal/models"
	"anoq/internal/service"

	"github.com/labstack/echo/v4"
)

type FormHandler struct {
	service *service.FormService
}

func NewFormHandler(service *service.FormService) *FormHandler {
	return &FormHandler{
		service: service,
	}
}

func (h *FormHandler) Register(e *echo.Echo) {
	e.POST("/api/forms", h.CreateForm)
	e.GET("/api/forms/:slug", h.GetForm)
	e.PATCH("/api/forms/:slug", h.UpdateForm)
	e.DELETE("/api/forms/:slug", h.DeleteForm)
	e.PATCH("/api/forms/:slug/open", h.OpenForm)
	e.PATCH("/api/forms/:slug/close", h.CloseForm)
}

// CreateForm godoc
// @Summary Create a new form
// @Description Create a new form with questions
// @Tags forms
// @Accept json
// @Produce json
// @Param input body models.FormInput true "Form input"
// @Success 201 {object} models.Form
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/forms [post]
func (h *FormHandler) CreateForm(c echo.Context) error {
	startTime := time.Now()

	input := new(models.FormInput)
	if err := c.Bind(input); err != nil {
		logger.Error("CreateForm: Invalid request payload", err)
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request payload",
		})
	}

	// Get user email from context (set by auth middleware)
	authorEmail := c.Get("user_email").(string)
	if authorEmail == "" {
		authorEmail = "anonymous@example.com" // Fallback for public forms
	}

	logger.Info("CreateForm: Creating new form", map[string]interface{}{
		"title":       input.Title,
		"authorEmail": authorEmail,
	})

	// Validate required fields
	if input.Title == "" {
		logger.Warn("CreateForm: Title is required", input.Title)
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Title is required",
		})
	}

	form, err := h.service.CreateForm(authorEmail, input)
	if err != nil {
		logger.Error("CreateForm: Error creating form", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	duration := time.Since(startTime)
	logger.Info("CreateForm: Form created successfully", map[string]interface{}{
		"formId":   form.ID,
		"slug":     form.Slug,
		"title":    form.Title,
		"duration": duration,
	})

	return c.JSON(http.StatusCreated, form)
}

// GetForm godoc
// @Summary Get a form by slug
// @Description Get a form's details by its slug
// @Tags forms
// @Accept json
// @Produce json
// @Param slug path string true "Form Slug"
// @Success 200 {object} models.Form
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/forms/{slug} [get]
func (h *FormHandler) GetForm(c echo.Context) error {
	startTime := time.Now()

	slug := c.Param("slug")

	logger.Debug("GetForm: Fetching form", map[string]interface{}{
		"slug": slug,
	})

	form, err := h.service.GetForm(slug)
	if err != nil {
		logger.Error("GetForm: Error getting form", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	duration := time.Since(startTime)
	logger.Info("GetForm: Form fetched successfully", map[string]interface{}{
		"formId":   form.ID,
		"slug":     form.Slug,
		"title":    form.Title,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, form)
}

// UpdateForm godoc
// @Summary Update a form
// @Description Update a form's details by its slug
// @Tags forms
// @Accept json
// @Produce json
// @Param slug path string true "Form Slug"
// @Param input body models.FormInput true "Form input"
// @Success 200 {object} models.Form
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/forms/{slug} [patch]
func (h *FormHandler) UpdateForm(c echo.Context) error {
	startTime := time.Now()

	slug := c.Param("slug")
	input := new(models.FormInput)
	if err := c.Bind(input); err != nil {
		logger.Error("UpdateForm: Invalid request payload", err)
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request payload",
		})
	}

	// Get user email from context (set by auth middleware)
	authorEmail := c.Get("user_email").(string)

	logger.Info("UpdateForm: Updating form", map[string]interface{}{
		"slug":        slug,
		"title":       input.Title,
		"authorEmail": authorEmail,
	})

	// Validate required fields
	if input.Title == "" {
		logger.Warn("UpdateForm: Title is required", input.Title)
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Title is required",
		})
	}

	form, err := h.service.UpdateForm(slug, authorEmail, input)
	if err != nil {
		logger.Error("UpdateForm: Error updating form", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	duration := time.Since(startTime)
	logger.Info("UpdateForm: Form updated successfully", map[string]interface{}{
		"formId":   form.ID,
		"slug":     form.Slug,
		"title":    form.Title,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, form)
}

// DeleteForm godoc
// @Summary Delete a form
// @Description Delete a form by its slug
// @Tags forms
// @Accept json
// @Produce json
// @Param slug path string true "Form Slug"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/forms/{slug} [delete]
func (h *FormHandler) DeleteForm(c echo.Context) error {
	startTime := time.Now()

	slug := c.Param("slug")
	authorEmail := c.Get("user_email").(string)

	logger.Info("DeleteForm: Deleting form", map[string]interface{}{
		"slug":        slug,
		"authorEmail": authorEmail,
	})

	if err := h.service.DeleteForm(slug, authorEmail); err != nil {
		logger.Error("DeleteForm: Error deleting form", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	duration := time.Since(startTime)
	logger.Info("DeleteForm: Form deleted successfully", map[string]interface{}{
		"slug":     slug,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Form deleted successfully",
	})
}

// OpenForm godoc
// @Summary Open a form
// @Description Set a form's status to open
// @Tags forms
// @Accept json
// @Produce json
// @Param slug path string true "Form Slug"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/forms/{slug}/open [patch]
func (h *FormHandler) OpenForm(c echo.Context) error {
	startTime := time.Now()

	slug := c.Param("slug")
	authorEmail := c.Get("user_email").(string)

	logger.Info("OpenForm: Opening form", map[string]interface{}{
		"slug":        slug,
		"authorEmail": authorEmail,
	})

	if err := h.service.UpdateFormStatus(slug, authorEmail, "open"); err != nil {
		logger.Error("OpenForm: Error opening form", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	duration := time.Since(startTime)
	logger.Info("OpenForm: Form opened successfully", map[string]interface{}{
		"slug":     slug,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Form opened successfully",
	})
}

// CloseForm godoc
// @Summary Close a form
// @Description Set a form's status to closed
// @Tags forms
// @Accept json
// @Produce json
// @Param slug path string true "Form Slug"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/forms/{slug}/close [patch]
func (h *FormHandler) CloseForm(c echo.Context) error {
	startTime := time.Now()

	slug := c.Param("slug")
	authorEmail := c.Get("user_email").(string)

	logger.Info("CloseForm: Closing form", map[string]interface{}{
		"slug":        slug,
		"authorEmail": authorEmail,
	})

	if err := h.service.UpdateFormStatus(slug, authorEmail, "closed"); err != nil {
		logger.Error("CloseForm: Error closing form", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	duration := time.Since(startTime)
	logger.Info("CloseForm: Form closed successfully", map[string]interface{}{
		"slug":     slug,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Form closed successfully",
	})
}
