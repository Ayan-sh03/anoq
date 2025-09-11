package handlers

import (
	"net/http"
	"strconv"
	"time"

	"anoq/internal/logger"
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
	startTime := time.Now()

	input := new(models.UserInput)
	if err := c.Bind(input); err != nil {
		logger.Error("CreateUser: Invalid request payload", err)
		return middleware.NewBadRequestError("Invalid request payload")
	}

	logger.Info("CreateUser: Creating new user", map[string]interface{}{
		"email": input.Email,
	})

	// Validate required fields
	if input.Email == "" {
		logger.Warn("CreateUser: Email is required", input.Email)
		return middleware.NewBadRequestError("Email is required")
	}

	user, err := h.service.CreateUser(input)
	if err != nil {
		// Check for specific error types
		if err.Error() == "user with email already exists" {
			logger.Warn("CreateUser: User already exists", input.Email)
			return middleware.NewConflictError(err.Error())
		}
		logger.Error("CreateUser: Error creating user", err)
		return middleware.NewInternalError("Error creating user", err.Error())
	}

	duration := time.Since(startTime)
	logger.Info("CreateUser: User created successfully", map[string]interface{}{
		"userId":   user.ID,
		"email":    user.Email,
		"duration": duration,
	})

	return c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) GetUser(c echo.Context) error {
	startTime := time.Now()

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Error("GetUser: Invalid user ID", err)
		return middleware.NewBadRequestError("Invalid user ID")
	}

	logger.Debug("GetUser: Fetching user", map[string]interface{}{
		"userId": id,
	})

	user, err := h.service.GetUser(id)
	if err != nil {
		if err.Error() == "user not found" {
			logger.Warn("GetUser: User not found", id)
			return middleware.NewNotFoundError("User not found")
		}
		logger.Error("GetUser: Error getting user", err)
		return middleware.NewInternalError("Error getting user", err.Error())
	}

	duration := time.Since(startTime)
	logger.Info("GetUser: User fetched successfully", map[string]interface{}{
		"userId":   user.ID,
		"email":    user.Email,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(c echo.Context) error {
	startTime := time.Now()

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Error("UpdateUser: Invalid user ID", err)
		return middleware.NewBadRequestError("Invalid user ID")
	}

	input := new(models.UserInput)
	if err := c.Bind(input); err != nil {
		logger.Error("UpdateUser: Invalid request payload", err)
		return middleware.NewBadRequestError("Invalid request payload")
	}

	logger.Info("UpdateUser: Updating user", map[string]interface{}{
		"userId": id,
		"email":  input.Email,
	})

	// Validate required fields
	if input.Email == "" {
		logger.Warn("UpdateUser: Email is required", input.Email)
		return middleware.NewBadRequestError("Email is required")
	}

	// Verify user ownership
	if c.Get("user_email").(string) != input.Email {
		logger.Warn("UpdateUser: Not authorized to update this user", map[string]interface{}{
			"requestEmail": c.Get("user_email").(string),
			"targetEmail":  input.Email,
		})
		return middleware.NewForbiddenError("Not authorized to update this user")
	}

	user, err := h.service.UpdateUser(id, input)
	if err != nil {
		if err.Error() == "user not found" {
			logger.Warn("UpdateUser: User not found", id)
			return middleware.NewNotFoundError("User not found")
		}
		if err.Error() == "email is already taken" {
			logger.Warn("UpdateUser: Email already taken", input.Email)
			return middleware.NewConflictError(err.Error())
		}
		logger.Error("UpdateUser: Error updating user", err)
		return middleware.NewInternalError("Error updating user", err.Error())
	}

	duration := time.Since(startTime)
	logger.Info("UpdateUser: User updated successfully", map[string]interface{}{
		"userId":   user.ID,
		"email":    user.Email,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(c echo.Context) error {
	startTime := time.Now()

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Error("DeleteUser: Invalid user ID", err)
		return middleware.NewBadRequestError("Invalid user ID")
	}

	logger.Info("DeleteUser: Deleting user", map[string]interface{}{
		"userId": id,
	})

	// Get user to verify ownership
	user, err := h.service.GetUser(id)
	if err != nil {
		if err.Error() == "user not found" {
			logger.Warn("DeleteUser: User not found", id)
			return middleware.NewNotFoundError("User not found")
		}
		logger.Error("DeleteUser: Error getting user", err)
		return middleware.NewInternalError("Error getting user", err.Error())
	}

	// Verify user ownership
	if c.Get("user_email").(string) != user.Email {
		logger.Warn("DeleteUser: Not authorized to delete this user", map[string]interface{}{
			"requestEmail": c.Get("user_email").(string),
			"targetEmail":  user.Email,
		})
		return middleware.NewForbiddenError("Not authorized to delete this user")
	}

	if err := h.service.DeleteUser(id); err != nil {
		logger.Error("DeleteUser: Error deleting user", err)
		return middleware.NewInternalError("Error deleting user", err.Error())
	}

	duration := time.Since(startTime)
	logger.Info("DeleteUser: User deleted successfully", map[string]interface{}{
		"userId":   id,
		"email":    user.Email,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, map[string]string{
		"message": "User deleted successfully",
	})
}
