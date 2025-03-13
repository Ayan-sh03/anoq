package middleware

import (
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/labstack/echo/v4"
)

func Auth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Skip auth for specific endpoints
			if skipAuth(c.Request().URL.Path, c.Request().Method) {
				return next(c)
			}

			// Get the Authorization header
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Authorization header is required",
				})
			}

			// Extract the token
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Invalid authorization format",
				})
			}
			token := parts[1]

			// Verify token using Kinde auth (for now just check against env var)
			validToken := os.Getenv("AUTH_TOKEN")
			if validToken == "" {
				return fmt.Errorf("AUTH_TOKEN environment variable not set")
			}

			if token != validToken {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Invalid token",
				})
			}

			// For now, hardcode user_email for development
			// In production, this would come from token verification
			c.Set("user_email", "test@example.com")

			return next(c)
		}
	}
}

// skipAuth determines if authentication can be skipped for certain paths
func skipAuth(path, method string) bool {
	// Public endpoints that don't require authentication
	publicPaths := []string{
		"/health",
		"/api/forms/.*/submit", // Form submission endpoint
	}

	// Skip auth for specific endpoint + method combinations
	if path == "/api/users" && method == http.MethodPost { // User creation
		return true
	}

	for _, p := range publicPaths {
		matched, err := regexp.MatchString(p, path)
		if err == nil && matched {
			return true
		}
	}

	// Allow GET requests to /api/forms/{slug} endpoint
	if method == http.MethodGet && strings.HasPrefix(path, "/api/forms/") && !strings.Contains(path, "/submissions") {
		return true
	}

	return false
}
