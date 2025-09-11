package auth

import (
	"net/http"
	"os"
	"time"

	"github.com/labstack/echo/v4"
)

// CookieConfig holds cookie configuration
type CookieConfig struct {
	Name     string
	Value    string
	Path     string
	Domain   string
	MaxAge   int
	Secure   bool
	HttpOnly bool
	SameSite http.SameSite
}

// DefaultCookieConfig returns default secure cookie configuration
func DefaultCookieConfig(name, value string) *CookieConfig {
	return &CookieConfig{
		Name:     name,
		Value:    value,
		Path:     "/",
		Domain:   "",
		MaxAge:   0, // Session cookie
		Secure:   isProduction(),
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}
}

// SetAuthCookies sets both access and refresh token cookies
func SetAuthCookies(c echo.Context, tokens *TokenPair) {
	// Set access token cookie
	accessCookie := createCookie("access_token", tokens.AccessToken, 15*60) // 15 minutes
	c.SetCookie(accessCookie)

	// Set refresh token cookie
	refreshCookie := createCookie("refresh_token", tokens.RefreshToken, 7*24*60*60) // 7 days
	c.SetCookie(refreshCookie)
}

// ClearAuthCookies removes authentication cookies
func ClearAuthCookies(c echo.Context) {
	// Clear access token cookie
	accessCookie := createExpiredCookie("access_token")
	c.SetCookie(accessCookie)

	// Clear refresh token cookie
	refreshCookie := createExpiredCookie("refresh_token")
	c.SetCookie(refreshCookie)
}

// createCookie creates a cookie with the specified configuration
func createCookie(name, value string, maxAge int) *http.Cookie {
	config := DefaultCookieConfig(name, value)
	config.MaxAge = maxAge

	return &http.Cookie{
		Name:     config.Name,
		Value:    config.Value,
		Path:     config.Path,
		Domain:   config.Domain,
		MaxAge:   config.MaxAge,
		Secure:   config.Secure,
		HttpOnly: config.HttpOnly,
		SameSite: config.SameSite,
	}
}

// createExpiredCookie creates an expired cookie to clear it
func createExpiredCookie(name string) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Expires:  time.Now().Add(-24 * time.Hour),
		Secure:   isProduction(),
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}
}

// isProduction checks if running in production mode
func isProduction() bool {
	return os.Getenv("ENVIRONMENT") == "production"
}

// GetCookieDomain returns the appropriate cookie domain
func GetCookieDomain() string {
	domain := os.Getenv("COOKIE_DOMAIN")
	if domain == "" {
		domain = os.Getenv("DOMAIN")
	}
	return domain
}

// SetCSRFCookie sets a CSRF protection cookie
func SetCSRFCookie(c echo.Context, csrfToken string) {
	cookie := createCookie("csrf_token", csrfToken, 24*60*60) // 24 hours
	c.SetCookie(cookie)
}

// ValidateCSRFCookie validates CSRF token from cookie against header
func ValidateCSRFCookie(c echo.Context) bool {
	cookie, err := c.Cookie("csrf_token")
	if err != nil {
		return false
	}

	headerToken := c.Request().Header.Get("X-CSRF-Token")
	return cookie.Value != "" && cookie.Value == headerToken
}