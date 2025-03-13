package handlers

import (
	"net/http"

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
	input := new(models.FormInput)
	if err := c.Bind(input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request payload",
		})
	}

	// Get user email from context (set by auth middleware)
	// authorEmail :=  c.Get("user_email").(string)
	authorEmail := "a@g.com"

	// Validate required fields
	if input.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Title is required",
		})
	}

	form, err := h.service.CreateForm(authorEmail, input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

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
	slug := c.Param("slug")

	form, err := h.service.GetForm(slug)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

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
	slug := c.Param("slug")
	input := new(models.FormInput)
	if err := c.Bind(input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request payload",
		})
	}

	// Get user email from context (set by auth middleware)
	authorEmail := c.Get("user_email").(string)

	// Validate required fields
	if input.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Title is required",
		})
	}

	form, err := h.service.UpdateForm(slug, authorEmail, input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

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
	slug := c.Param("slug")
	authorEmail := c.Get("user_email").(string)

	if err := h.service.DeleteForm(slug, authorEmail); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

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
	slug := c.Param("slug")
	authorEmail := c.Get("user_email").(string)

	if err := h.service.UpdateFormStatus(slug, authorEmail, "open"); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

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
	slug := c.Param("slug")
	authorEmail := c.Get("user_email").(string)

	if err := h.service.UpdateFormStatus(slug, authorEmail, "closed"); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Form closed successfully",
	})
}
