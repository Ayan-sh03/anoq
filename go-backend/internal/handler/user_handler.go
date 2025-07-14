package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ayan-sh03/anoq/internal/model"
	"github.com/ayan-sh03/anoq/internal/repository"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	userRepo repository.UserRepo
}

// NewUserHandler creates a new user handler
func NewUserHandler(userRepo repository.UserRepo) *UserHandler {
	return &UserHandler{
		userRepo: userRepo,
	}
}

// Register handles POST /api/auth/register
// @Summary Register a new user
// @Description Create a new user account with email and password
// @Tags Authentication
// @Accept json
// @Produce json
// @Param user body object{email=string,password=string,username=string,family_name=string,given_name=string} true "User registration data"
// @Success 201 {object} object{message=string,user=model.User,token=string} "User registered successfully"
// @Failure 400 {object} object{error=string} "Invalid request body"
// @Failure 409 {object} object{error=string} "User with this email already exists"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/auth/register [post]
func (h *UserHandler) Register(c *gin.Context) {
	var req struct {
		Email      string  `json:"email" binding:"required,email"`
		Password   string  `json:"password" binding:"required,min=6"`
		Username   *string `json:"username"`
		FamilyName *string `json:"family_name"`
		GivenName  *string `json:"given_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Check if user already exists
	if _, err := h.userRepo.GetUserByEmail(c.Request.Context(), req.Email); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
		return
	}

	// Hash password
	passwordHash, err := h.userRepo.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := &model.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: passwordHash,
		Username:     req.Username,
		FamilyName:   req.FamilyName,
		GivenName:    req.GivenName,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.userRepo.CreateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Create session
	session, err := h.userRepo.CreateSession(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    user,
		"token":   session.Token,
	})
}

// Login handles POST /api/auth/login
// @Summary Login user
// @Description Authenticate user with email and password
// @Tags Authentication
// @Accept json
// @Produce json
// @Param credentials body object{email=string,password=string} true "User login credentials"
// @Success 200 {object} object{message=string,user=model.User,token=string} "Login successful"
// @Failure 400 {object} object{error=string} "Invalid request body"
// @Failure 401 {object} object{error=string} "Invalid email or password"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/auth/login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get user by email
	user, err := h.userRepo.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check password
	if !h.userRepo.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Create session
	session, err := h.userRepo.CreateSession(c.Request.Context(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    user,
		"token":   session.Token,
	})
}

// Logout handles POST /api/auth/logout
// @Summary Logout user
// @Description Invalidate user session and logout
// @Tags Authentication
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} object{message=string} "Logout successful"
// @Failure 400 {object} object{error=string} "No active session"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/auth/logout [post]
func (h *UserHandler) Logout(c *gin.Context) {
	// Get session from context (set by auth middleware)
	sessionVal, exists := c.Get("session")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active session"})
		return
	}

	session := sessionVal.(*model.UserSession)

	// Delete session
	if err := h.userRepo.DeleteSession(c.Request.Context(), session.Token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
	})
}

// GetUser handles GET /api/user
// @Summary Get current user
// @Description Get current authenticated user information
// @Tags User
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} object{user=model.User} "User information"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 404 {object} object{error=string} "User not found"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/user [get]
func (h *UserHandler) GetUser(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.userRepo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// UpdateUser handles PUT /api/user
// @Summary Update current user
// @Description Update current authenticated user information
// @Tags User
// @Accept json
// @Produce json
// @Security Bearer
// @Param user body model.UpdateUserRequest true "User update data"
// @Success 200 {object} object{message=string,user=model.User} "User updated successfully"
// @Failure 400 {object} object{error=string} "Invalid request body"
// @Failure 401 {object} object{error=string} "Authentication required"
// @Failure 404 {object} object{error=string} "User not found"
// @Failure 500 {object} object{error=string} "Internal server error"
// @Router /api/user [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse request body
	var updateReq struct {
		Username   string `json:"username"`
		FamilyName string `json:"family_name"`
		GivenName  string `json:"given_name"`
	}

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get existing user
	user, err := h.userRepo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	// Update user fields
	user.Username = &updateReq.Username
	user.FamilyName = &updateReq.FamilyName
	user.GivenName = &updateReq.GivenName
	user.UpdatedAt = time.Now()

	// Save updated user
	if err := h.userRepo.UpdateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user":    user,
	})
}
