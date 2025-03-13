package handlers

import (
	"net/http"
	"strconv"

	"anoq/internal/middleware"
	"anoq/internal/models"
	"anoq/internal/service"

	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{
		service: service,
	}
}

func (h *UserHandler) Register(e *echo.Echo) {
	e.POST("/api/users", h.CreateUser)
	e.GET("/api/users/:id", h.GetUser)
	e.PATCH("/api/users/:id", h.UpdateUser)
	e.DELETE("/api/users/:id", h.DeleteUser)
}

func (h *UserHandler) CreateUser(c echo.Context) error {
	input := new(models.UserInput)
	if err := c.Bind(input); err != nil {
		return middleware.NewBadRequestError("Invalid request payload")
	}

	// Validate required fields
	if input.Email == "" {
		return middleware.NewBadRequestError("Email is required")
	}

	user, err := h.service.CreateUser(input)
	if err != nil {
		// Check for specific error types
		if err.Error() == "user with email already exists" {
			return middleware.NewConflictError(err.Error())
		}
		return middleware.NewInternalError("Error creating user", err.Error())
	}

	return c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) GetUser(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return middleware.NewBadRequestError("Invalid user ID")
	}

	user, err := h.service.GetUser(id)
	if err != nil {
		if err.Error() == "user not found" {
			return middleware.NewNotFoundError("User not found")
		}
		return middleware.NewInternalError("Error getting user", err.Error())
	}

	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return middleware.NewBadRequestError("Invalid user ID")
	}

	input := new(models.UserInput)
	if err := c.Bind(input); err != nil {
		return middleware.NewBadRequestError("Invalid request payload")
	}

	// Validate required fields
	if input.Email == "" {
		return middleware.NewBadRequestError("Email is required")
	}

	// Verify user ownership
	if c.Get("user_email").(string) != input.Email {
		return middleware.NewForbiddenError("Not authorized to update this user")
	}

	user, err := h.service.UpdateUser(id, input)
	if err != nil {
		if err.Error() == "user not found" {
			return middleware.NewNotFoundError("User not found")
		}
		if err.Error() == "email is already taken" {
			return middleware.NewConflictError(err.Error())
		}
		return middleware.NewInternalError("Error updating user", err.Error())
	}

	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return middleware.NewBadRequestError("Invalid user ID")
	}

	// Get user to verify ownership
	user, err := h.service.GetUser(id)
	if err != nil {
		if err.Error() == "user not found" {
			return middleware.NewNotFoundError("User not found")
		}
		return middleware.NewInternalError("Error getting user", err.Error())
	}

	// Verify user ownership
	if c.Get("user_email").(string) != user.Email {
		return middleware.NewForbiddenError("Not authorized to delete this user")
	}

	if err := h.service.DeleteUser(id); err != nil {
		return middleware.NewInternalError("Error deleting user", err.Error())
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "User deleted successfully",
	})
}
