package middleware

import (
	"fmt"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
)

// ErrorResponse represents a standard error response structure
type ErrorResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
	Details any    `json:"details,omitempty"`
}

// ErrorHandler is a custom error handling middleware
func ErrorHandler() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)
			if err == nil {
				return nil
			}

			// Log the error
			log.Printf("Error: %v", err)

			// Create error response
			var response ErrorResponse

			// Handle echo HTTPError
			if he, ok := err.(*echo.HTTPError); ok {
				response.Status = he.Code
				response.Message = fmt.Sprintf("%v", he.Message)
				return c.JSON(he.Code, response)
			}

			// Handle business errors
			switch e := err.(type) {
			case *BusinessError:
				response.Status = e.Status
				response.Message = e.Message
				response.Code = e.Code
				response.Details = e.Details
				return c.JSON(e.Status, response)

			default:
				// Handle unknown errors
				response.Status = http.StatusInternalServerError
				response.Message = "Internal server error"
				return c.JSON(http.StatusInternalServerError, response)
			}
		}
	}
}

// BusinessError represents a domain-specific error
type BusinessError struct {
	Status  int    // HTTP status code
	Message string // Error message
	Code    string // Error code for client handling
	Details any    // Additional error details
}

func (e *BusinessError) Error() string {
	return e.Message
}

// Error creation helpers
func NewNotFoundError(message string) *BusinessError {
	return &BusinessError{
		Status:  http.StatusNotFound,
		Message: message,
		Code:    "NOT_FOUND",
	}
}

func NewBadRequestError(message string) *BusinessError {
	return &BusinessError{
		Status:  http.StatusBadRequest,
		Message: message,
		Code:    "BAD_REQUEST",
	}
}

func NewUnauthorizedError(message string) *BusinessError {
	return &BusinessError{
		Status:  http.StatusUnauthorized,
		Message: message,
		Code:    "UNAUTHORIZED",
	}
}

func NewForbiddenError(message string) *BusinessError {
	return &BusinessError{
		Status:  http.StatusForbidden,
		Message: message,
		Code:    "FORBIDDEN",
	}
}

func NewInternalError(message string, details any) *BusinessError {
	return &BusinessError{
		Status:  http.StatusInternalServerError,
		Message: message,
		Code:    "INTERNAL_ERROR",
		Details: details,
	}
}

func NewConflictError(message string) *BusinessError {
	return &BusinessError{
		Status:  http.StatusConflict,
		Message: message,
		Code:    "CONFLICT",
	}
}
