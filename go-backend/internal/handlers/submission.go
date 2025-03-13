package handlers

import (
	"net/http"
	"strconv"

	"anoq/internal/models"
	"anoq/internal/service"

	"github.com/labstack/echo/v4"
)

type SubmissionHandler struct {
	service *service.SubmissionService
}

func NewSubmissionHandler(service *service.SubmissionService) *SubmissionHandler {
	return &SubmissionHandler{
		service: service,
	}
}

func (h *SubmissionHandler) Register(e *echo.Echo) {
	e.POST("/api/forms/:slug/submit", h.SubmitForm)
	e.GET("/api/forms/:slug/submissions", h.GetFormSubmissions)
	e.GET("/api/submissions/:id", h.GetSubmission)
	e.DELETE("/api/submissions/:id", h.DeleteSubmission)
}

// SubmitForm godoc
// @Summary Submit a form
// @Description Submit answers to a form
// @Tags submissions
// @Accept json
// @Produce json
// @Param slug path string true "Form Slug"
// @Param input body models.FilledFormInput true "Submission input"
// @Success 201 {object} models.FilledForm
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/forms/{slug}/submit [post]
func (h *SubmissionHandler) SubmitForm(c echo.Context) error {
	slug := c.Param("slug")
	input := new(models.FilledFormInput)
	if err := c.Bind(input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request payload",
		})
	}

	// Get IP address from request
	ipAddress := c.RealIP()

	// Validate required fields
	if input.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Name is required",
		})
	}
	if input.Email == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Email is required",
		})
	}

	submission, err := h.service.SubmitForm(slug, input, ipAddress)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusCreated, submission)
}

// GetFormSubmissions godoc
// @Summary Get all submissions for a form
// @Description Get all submissions for a form by its slug
// @Tags submissions
// @Accept json
// @Produce json
// @Param slug path string true "Form Slug"
// @Success 200 {array} models.FilledForm
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/forms/{slug}/submissions [get]
func (h *SubmissionHandler) GetFormSubmissions(c echo.Context) error {
	slug := c.Param("slug")

	// Verify that the requester is the form owner (handled by auth middleware)
	// authorEmail := c.Get("user_email").(string)

	submissions, err := h.service.GetFormSubmissions(slug)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, submissions)
}

// GetSubmission godoc
// @Summary Get a submission
// @Description Get a submission's details by its ID
// @Tags submissions
// @Accept json
// @Produce json
// @Param id path int true "Submission ID"
// @Success 200 {object} models.FilledForm
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/submissions/{id} [get]
func (h *SubmissionHandler) GetSubmission(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid submission ID",
		})
	}

	submission, err := h.service.GetSubmission(id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, submission)
}

// DeleteSubmission godoc
// @Summary Delete a submission
// @Description Delete a submission by its ID
// @Tags submissions
// @Accept json
// @Produce json
// @Param id path int true "Submission ID"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/submissions/{id} [delete]
func (h *SubmissionHandler) DeleteSubmission(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid submission ID",
		})
	}

	if err := h.service.DeleteSubmission(id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Submission deleted successfully",
	})
}
