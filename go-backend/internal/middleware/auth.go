package middleware

import (
	"net/http"
	"regexp"
	"strings"

	"anoq/internal/auth"

	"github.com/labstack/echo/v4"
)

func Auth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Skip auth for specific endpoints
			if skipAuth(c.Request().URL.Path, c.Request().Method) {
				return next(c)
			}

			// Get the Authorization header or access_token cookie
			var tokenString string

			// Check Authorization header first
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					tokenString = parts[1]
				}
			}

			// If no header, check cookie
			if tokenString == "" {
				cookie, err := c.Cookie("access_token")
				if err == nil {
					tokenString = cookie.Value
				}
			}

			if tokenString == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Authentication required",
				})
			}

			// Validate JWT token
			claims, err := auth.ValidateAccessToken(tokenString)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Invalid or expired token",
				})
			}

			// Set user context
			c.Set("user_id", claims.UserID)
			c.Set("user_email", claims.Email)

			return next(c)
		}
	}
}

// skipAuth determines if authentication can be skipped for certain paths
func skipAuth(path, method string) bool {
	// Public endpoints that don't require authentication
	publicPaths := []string{
		"/health",
		"/api/auth/login",
		"/api/auth/register",
		"/api/auth/refresh",
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
