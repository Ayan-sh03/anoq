package handler_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"

	"github.com/ayan-sh03/anoq/internal/handler"
	"github.com/ayan-sh03/anoq/internal/model"
	"github.com/ayan-sh03/anoq/internal/repository/mocks"
	"github.com/google/uuid"
)

func TestUserHandler_Register(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Success", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		userInput := struct {
			Username   string `json:"username"`
			Email      string `json:"email"`
			Password   string `json:"password"`
			FamilyName string `json:"family_name"`
			GivenName  string `json:"given_name"`
		}{
			Username:   "testuser",
			Email:      "test@example.com",
			Password:   "password123",
			FamilyName: "User",
			GivenName:  "Test",
		}
		jsonBody, _ := json.Marshal(userInput)
		req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		// Fix: User doesn't exist, should return sql.ErrNoRows
		mockUserRepo.EXPECT().
			GetUserByEmail(gomock.Any(), userInput.Email).
			Return(nil, sql.ErrNoRows)

		mockUserRepo.EXPECT().
			HashPassword(userInput.Password).
			Return("hashedpassword", nil)

		// Fix: CreateUser takes (context.Context, *model.User) and returns error
		mockUserRepo.EXPECT().
			CreateUser(gomock.Any(), gomock.Any()).
			Return(nil)

		// Fix: CreateSession takes (context.Context, uuid.UUID) and returns (*model.UserSession, error)
		userID := uuid.New()
		mockUserRepo.EXPECT().
			CreateSession(gomock.Any(), gomock.Any()).
			Return(&model.UserSession{
				ID:     uuid.New(),
				UserID: userID,
				Token:  "new-session-token",
			}, nil)

		userHandler.Register(c)

		assert.Equal(t, http.StatusCreated, w.Code)
		var responseBody map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &responseBody)
		assert.NoError(t, err)
		assert.Equal(t, "User registered successfully", responseBody["message"])
		// Check for user and token in response
		assert.Contains(t, responseBody, "user")
		assert.Contains(t, responseBody, "token")
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		// Malformed JSON
		req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBufferString(`{"email": "test@example.com",`))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		userHandler.Register(c)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var responseBody map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &responseBody)
		assert.NoError(t, err)
		assert.Equal(t, "Invalid request body", responseBody["error"])
	})

	t.Run("Invalid Input - Missing Required Field", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		userInput := struct {
			Username string `json:"username"`
			// Email is missing, but required
			Password string `json:"password"`
		}{
			Username: "testuser",
			Password: "password123",
		}
		jsonBody, _ := json.Marshal(userInput)
		req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		userHandler.Register(c)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("User Already Exists", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		userInput := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: "password123",
		}
		jsonBody, _ := json.Marshal(userInput)
		req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		mockUserRepo.EXPECT().
			GetUserByEmail(gomock.Any(), userInput.Email).
			Return(&model.User{}, nil) // User exists

		userHandler.Register(c)

		assert.Equal(t, http.StatusConflict, w.Code)
	})

	t.Run("Password Hashing Fails", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		userInput := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: "password123",
		}
		jsonBody, _ := json.Marshal(userInput)
		req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		// Fix: User doesn't exist, should return sql.ErrNoRows
		mockUserRepo.EXPECT().
			GetUserByEmail(gomock.Any(), userInput.Email).
			Return(nil, sql.ErrNoRows)

		mockUserRepo.EXPECT().
			HashPassword(userInput.Password).
			Return("", errors.New("hashing error"))

		userHandler.Register(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("CreateUser Fails", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		userInput := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: "password123",
		}
		jsonBody, _ := json.Marshal(userInput)
		req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		// Fix: User doesn't exist, should return sql.ErrNoRows
		mockUserRepo.EXPECT().
			GetUserByEmail(gomock.Any(), userInput.Email).
			Return(nil, sql.ErrNoRows)

		mockUserRepo.EXPECT().
			HashPassword(userInput.Password).
			Return("hashedpassword", nil)

		mockUserRepo.EXPECT().
			CreateUser(gomock.Any(), gomock.Any()).
			Return(errors.New("db error"))

		userHandler.Register(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("CreateSession Fails", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		userInput := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: "password123",
		}
		jsonBody, _ := json.Marshal(userInput)
		req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		// Fix: User doesn't exist, should return sql.ErrNoRows
		mockUserRepo.EXPECT().
			GetUserByEmail(gomock.Any(), userInput.Email).
			Return(nil, sql.ErrNoRows)

		mockUserRepo.EXPECT().
			HashPassword(userInput.Password).
			Return("hashedpassword", nil)

		mockUserRepo.EXPECT().
			CreateUser(gomock.Any(), gomock.Any()).
			Return(nil)

		mockUserRepo.EXPECT().
			CreateSession(gomock.Any(), gomock.Any()).
			Return(nil, errors.New("session error"))

		userHandler.Register(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestUserHandler_Login(t *testing.T) {
	gin.SetMode(gin.TestMode)
	password := "password123"
	hashedPassword := "$2a$10$0.xalj8p9z3zQ2c4h6B7y.uV3zBv8D8c9c7b6a5a4s3s2d1f0g9h" // Dummy hash

	t.Run("Success", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		loginInput := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: password,
		}
		jsonBody, _ := json.Marshal(loginInput)
		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		mockUser := &model.User{
			ID:           uuid.New(),
			Email:        loginInput.Email,
			PasswordHash: hashedPassword,
		}

		mockUserRepo.EXPECT().
			GetUserByEmail(gomock.Any(), loginInput.Email).
			Return(mockUser, nil)

		mockUserRepo.EXPECT().
			CheckPassword(password, hashedPassword).
			Return(true)

		mockUserRepo.EXPECT().
			CreateSession(gomock.Any(), mockUser.ID).
			Return(&model.UserSession{Token: "session-token"}, nil)

		userHandler.Login(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var responseBody map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &responseBody)
		assert.Equal(t, "Login successful", responseBody["message"])
		assert.Contains(t, responseBody, "token")
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBufferString(`{"email":`))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		userHandler.Login(c)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("User Not Found", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		loginInput := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "nonexistent@example.com",
			Password: password,
		}
		jsonBody, _ := json.Marshal(loginInput)
		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		mockUserRepo.EXPECT().
			GetUserByEmail(gomock.Any(), loginInput.Email).
			Return(nil, errors.New("not found"))

		userHandler.Login(c)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("Incorrect Password", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		loginInput := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: "wrongpassword",
		}
		jsonBody, _ := json.Marshal(loginInput)
		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		mockUser := &model.User{
			ID:           uuid.New(),
			Email:        loginInput.Email,
			PasswordHash: hashedPassword,
		}

		mockUserRepo.EXPECT().
			GetUserByEmail(gomock.Any(), loginInput.Email).
			Return(mockUser, nil)

		mockUserRepo.EXPECT().
			CheckPassword(loginInput.Password, hashedPassword).
			Return(false)

		userHandler.Login(c)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("Session Creation Fails", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		loginInput := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "test@example.com",
			Password: password,
		}
		jsonBody, _ := json.Marshal(loginInput)
		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		mockUser := &model.User{
			ID:           uuid.New(),
			Email:        loginInput.Email,
			PasswordHash: hashedPassword,
		}

		mockUserRepo.EXPECT().
			GetUserByEmail(gomock.Any(), loginInput.Email).
			Return(mockUser, nil)

		mockUserRepo.EXPECT().
			CheckPassword(password, hashedPassword).
			Return(true)

		mockUserRepo.EXPECT().
			CreateSession(gomock.Any(), mockUser.ID).
			Return(nil, errors.New("session error"))

		userHandler.Login(c)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestUserHandler_GetUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	userID := uuid.New()

	t.Run("Success", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		// Simulate middleware setting user_id
		c.Set("user_id", userID.String())

		req, _ := http.NewRequest(http.MethodGet, "/user", nil)
		c.Request = req

		mockUser := &model.User{ID: userID, Email: "test@example.com"}
		mockUserRepo.EXPECT().
			GetUserByID(gomock.Any(), userID).
			Return(mockUser, nil)

		userHandler.GetUser(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var responseBody map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &responseBody)
		assert.NotNil(t, responseBody["user"])
	})

	t.Run("User Not Authenticated", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		req, _ := http.NewRequest(http.MethodGet, "/user", nil)
		c.Request = req

		// No user_id in context
		userHandler.GetUser(c)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("Invalid User ID", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		// Simulate middleware setting an invalid user_id
		c.Set("user_id", "not-a-uuid")

		req, _ := http.NewRequest(http.MethodGet, "/user", nil)
		c.Request = req

		userHandler.GetUser(c)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("User Not Found", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		c.Set("user_id", userID.String())
		req, _ := http.NewRequest(http.MethodGet, "/user", nil)
		c.Request = req

		mockUserRepo.EXPECT().
			GetUserByID(gomock.Any(), userID).
			Return(nil, errors.New("user not found"))

		userHandler.GetUser(c)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("DB Error", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		c.Set("user_id", userID.String())
		req, _ := http.NewRequest(http.MethodGet, "/user", nil)
		c.Request = req

		mockUserRepo.EXPECT().
			GetUserByID(gomock.Any(), userID).
			Return(nil, errors.New("some db error"))

		userHandler.GetUser(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestUserHandler_UpdateUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	userID := uuid.New()

	updateInput := struct {
		Username   string `json:"username"`
		FamilyName string `json:"family_name"`
		GivenName  string `json:"given_name"`
	}{
		Username:   "new_username",
		FamilyName: "NewFamily",
		GivenName:  "NewGiven",
	}

	t.Run("Success", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("user_id", userID.String())

		jsonBody, _ := json.Marshal(updateInput)
		req, _ := http.NewRequest(http.MethodPut, "/user", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		existingUser := &model.User{ID: userID}
		mockUserRepo.EXPECT().GetUserByID(gomock.Any(), userID).Return(existingUser, nil)
		// Fix: Use proper type for context parameter
		mockUserRepo.EXPECT().UpdateUser(gomock.Any(), gomock.Any()).Return(nil)

		userHandler.UpdateUser(c)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("User Not Authenticated", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		// No user_id in context

		req, _ := http.NewRequest(http.MethodPut, "/user", nil)
		c.Request = req

		userHandler.UpdateUser(c)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("user_id", userID.String())

		req, _ := http.NewRequest(http.MethodPut, "/user", bytes.NewBufferString(`{"username":`))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		userHandler.UpdateUser(c)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("GetUser Fails", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("user_id", userID.String())

		jsonBody, _ := json.Marshal(updateInput)
		req, _ := http.NewRequest(http.MethodPut, "/user", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		mockUserRepo.EXPECT().GetUserByID(gomock.Any(), userID).Return(nil, errors.New("user not found"))

		userHandler.UpdateUser(c)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("UpdateUser Fails", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("user_id", userID.String())

		jsonBody, _ := json.Marshal(updateInput)
		req, _ := http.NewRequest(http.MethodPut, "/user", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		existingUser := &model.User{ID: userID}
		mockUserRepo.EXPECT().GetUserByID(gomock.Any(), userID).Return(existingUser, nil)
		mockUserRepo.EXPECT().UpdateUser(gomock.Any(), gomock.Any()).Return(errors.New("db error"))

		userHandler.UpdateUser(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestUserHandler_Logout(t *testing.T) {
	gin.SetMode(gin.TestMode)

	session := &model.UserSession{
		Token:  "valid-token",
		UserID: uuid.New(),
	}

	t.Run("Success", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		c.Set("session", session)
		req, _ := http.NewRequest(http.MethodPost, "/logout", nil)
		c.Request = req

		mockUserRepo.EXPECT().
			DeleteSession(gomock.Any(), session.Token).
			Return(nil)

		userHandler.Logout(c)

		assert.Equal(t, http.StatusOK, w.Code)
		var responseBody map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &responseBody)
		assert.Equal(t, "Logout successful", responseBody["message"])
	})

	t.Run("No Session", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		// No session in context

		req, _ := http.NewRequest(http.MethodPost, "/logout", nil)
		c.Request = req

		userHandler.Logout(c)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("DeleteSession Fails", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockUserRepo := mocks.NewMockUserRepo(ctrl)
		userHandler := handler.NewUserHandler(mockUserRepo)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		c.Set("session", session)
		req, _ := http.NewRequest(http.MethodPost, "/logout", nil)
		c.Request = req

		mockUserRepo.EXPECT().
			DeleteSession(gomock.Any(), session.Token).
			Return(errors.New("db error"))

		userHandler.Logout(c)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}
