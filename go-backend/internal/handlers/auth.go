package handlers

import (
	"fmt"
	"net/http"
	"time"

	"anoq/internal/auth"
	"anoq/internal/logger"
	"anoq/internal/middleware"
	"anoq/internal/models"
	"anoq/internal/service"

	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	userService *service.UserService
}

func NewAuthHandler(userService *service.UserService) *AuthHandler {
	return &AuthHandler{
		userService: userService,
	}
}

func (h *AuthHandler) Register(e *echo.Echo) {
	e.POST("/api/auth/register", h.RegisterUser)
	e.POST("/api/auth/login", h.Login)
	e.POST("/api/auth/refresh", h.RefreshToken)
	e.POST("/api/auth/logout", h.Logout)
	e.GET("/api/auth/me", h.GetCurrentUser, middleware.Auth())
}

func (h *AuthHandler) RegisterUser(c echo.Context) error {
	startTime := time.Now()

	input := new(models.UserRegister)
	if err := c.Bind(input); err != nil {
		logger.Error("Register: Invalid request payload", err)
		return middleware.NewBadRequestError("Invalid request payload")
	}

	logger.Info("Register: Registration attempt", input.Email)

	// Validate password
	if !auth.IsValidPassword(input.Password) {
		logger.Warn("Register: Invalid password format", input.Email)
		return middleware.NewBadRequestError("Password must be at least 8 characters with uppercase, lowercase, and numbers")
	}

	// Hash password
	passwordHash, err := auth.HashPassword(input.Password)
	if err != nil {
		logger.Error("Register: Error hashing password", err)
		return middleware.NewInternalError("Error processing password", err.Error())
	}

	// Create user with password
	user, err := h.userService.CreateUserWithPassword(input, passwordHash)
	if err != nil {
		if err.Error() == fmt.Sprintf("user with email %s already exists", input.Email) {
			logger.Warn("Register: User already exists", input.Email)
			return middleware.NewConflictError("User with this email already exists")
		}
		logger.Error("Register: Error creating user", err)
		return middleware.NewInternalError("Error creating user", err.Error())
	}

	// Generate tokens
	tokens, err := auth.GenerateTokenPair(user.ID, user.Email)
	if err != nil {
		logger.Error("Register: Error generating tokens", err)
		return middleware.NewInternalError("Error generating tokens", err.Error())
	}

	// Set secure HTTP-only cookies
	auth.SetAuthCookies(c, tokens)

	duration := time.Since(startTime)
	logger.LogAuthEvent("register", user.Email, user.ID, true)
	logger.Info("Register: Registration successful", map[string]interface{}{
		"userId":   user.ID,
		"email":    user.Email,
		"duration": duration,
	})

	return c.JSON(http.StatusCreated, &models.AuthResponse{
		User:         user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt,
	})
}

func (h *AuthHandler) Login(c echo.Context) error {
	startTime := time.Now()

	input := new(models.UserLogin)
	if err := c.Bind(input); err != nil {
		logger.Error("Login: Invalid request payload", err)
		return middleware.NewBadRequestError("Invalid request payload")
	}

	logger.Info("Login: Login attempt", input.Email)

	// Get user by email
	user, err := h.userService.GetUserByEmail(input.Email)
	if err != nil {
		logger.LogAuthEvent("login", input.Email, 0, false)
		return middleware.NewUnauthorizedError("Invalid credentials")
	}

	// Verify password
	if err := auth.VerifyPassword(input.Password, user.PasswordHash); err != nil {
		logger.LogAuthEvent("login", input.Email, user.ID, false)
		logger.Warn("Login: Invalid password", input.Email)
		return middleware.NewUnauthorizedError("Invalid credentials")
	}

	// Generate tokens
	tokens, err := auth.GenerateTokenPair(user.ID, user.Email)
	if err != nil {
		logger.Error("Login: Error generating tokens", err)
		return middleware.NewInternalError("Error generating tokens", err.Error())
	}

	// Set secure HTTP-only cookies
	auth.SetAuthCookies(c, tokens)

	duration := time.Since(startTime)
	logger.LogAuthEvent("login", user.Email, user.ID, true)
	logger.Info("Login: Login successful", map[string]interface{}{
		"userId":   user.ID,
		"email":    user.Email,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, &models.AuthResponse{
		User:         user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt,
	})
}

func (h *AuthHandler) RefreshToken(c echo.Context) error {
	startTime := time.Now()

	// Get refresh token from cookie or request body
	refreshToken := c.FormValue("refresh_token")
	if refreshToken == "" {
		cookie, err := c.Cookie("refresh_token")
		if err != nil || cookie.Value == "" {
			logger.Warn("RefreshToken: No refresh token provided")
			return middleware.NewUnauthorizedError("Refresh token required")
		}
		refreshToken = cookie.Value
	}

	// Validate refresh token
	claims, err := auth.ValidateRefreshToken(refreshToken)
	if err != nil {
		logger.Error("RefreshToken: Invalid refresh token", err)
		return middleware.NewUnauthorizedError("Invalid refresh token")
	}

	logger.Debug("RefreshToken: Validating refresh token", claims.Email)

	// Get user
	user, err := h.userService.GetUser(claims.UserID)
	if err != nil {
		logger.Error("RefreshToken: User not found", err)
		return middleware.NewUnauthorizedError("User not found")
	}

	// Generate new tokens
	tokens, err := auth.GenerateTokenPair(user.ID, user.Email)
	if err != nil {
		logger.Error("RefreshToken: Error generating tokens", err)
		return middleware.NewInternalError("Error generating tokens", err.Error())
	}

	// Set new cookies
	auth.SetAuthCookies(c, tokens)

	duration := time.Since(startTime)
	logger.Info("RefreshToken: Token refresh successful", map[string]interface{}{
		"userId":   user.ID,
		"email":    user.Email,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, &models.AuthResponse{
		User:         user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt,
	})
}

func (h *AuthHandler) Logout(c echo.Context) error {
	startTime := time.Now()

	// Get user info before clearing cookies
	userID := 0
	email := "unknown"

	if claims, err := auth.ValidateAccessToken(c.FormValue("access_token")); err == nil {
		userID = claims.UserID
		email = claims.Email
	} else if cookie, err := c.Cookie("access_token"); err == nil {
		if claims, err := auth.ValidateAccessToken(cookie.Value); err == nil {
			userID = claims.UserID
			email = claims.Email
		}
	}

	// Clear authentication cookies
	auth.ClearAuthCookies(c)

	duration := time.Since(startTime)
	logger.LogAuthEvent("logout", email, userID, true)
	logger.Info("Logout: Logout successful", map[string]interface{}{
		"userId":   userID,
		"email":    email,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Logged out successfully",
	})
}

func (h *AuthHandler) GetCurrentUser(c echo.Context) error {
	startTime := time.Now()

	// Get user ID from context (set by Auth middleware)
	userID := c.Get("user_id").(int)
	email := c.Get("user_email").(string)

	logger.Debug("GetCurrentUser: Fetching current user", map[string]interface{}{
		"userId": userID,
		"email":  email,
	})

	// Get user details
	user, err := h.userService.GetUser(userID)
	if err != nil {
		logger.Error("GetCurrentUser: User not found", err)
		return middleware.NewUnauthorizedError("User not found")
	}

	duration := time.Since(startTime)
	logger.Debug("GetCurrentUser: Current user fetched", map[string]interface{}{
		"userId":   user.ID,
		"email":    user.Email,
		"duration": duration,
	})

	return c.JSON(http.StatusOK, user)
}