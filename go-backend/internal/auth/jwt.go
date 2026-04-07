package auth

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
}

// GenerateTokenPair creates both access and refresh tokens
func GenerateTokenPair(userID int, email string) (*TokenPair, error) {
	// Load secrets from environment
	accessSecret := os.Getenv("JWT_ACCESS_SECRET")
	refreshSecret := os.Getenv("JWT_REFRESH_SECRET")
	if accessSecret == "" || refreshSecret == "" {
		return nil, fmt.Errorf("JWT secrets not configured")
	}

	// Get token durations from environment with defaults
	accessDuration := getDurationFromEnv("JWT_ACCESS_DURATION_MINUTES", 15)
	refreshDuration := getDurationFromEnv("JWT_REFRESH_DURATION_HOURS", 24*7) // 7 days

	// Create access token
	accessClaims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "anoq-api",
			Subject:   fmt.Sprintf("%d", userID),
			ID:        uuid.New().String(),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(accessSecret))
	if err != nil {
		return nil, fmt.Errorf("error signing access token: %w", err)
	}

	// Create refresh token
	refreshClaims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(refreshDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "anoq-api",
			Subject:   fmt.Sprintf("%d", userID),
			ID:        uuid.New().String(),
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(refreshSecret))
	if err != nil {
		return nil, fmt.Errorf("error signing refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
		ExpiresAt:    time.Now().Add(accessDuration).Unix(),
	}, nil
}

// ValidateAccessToken validates and parses an access token
func ValidateAccessToken(tokenString string) (*Claims, error) {
	accessSecret := os.Getenv("JWT_ACCESS_SECRET")
	if accessSecret == "" {
		return nil, fmt.Errorf("JWT access secret not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(accessSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("error parsing token: %w", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ValidateRefreshToken validates and parses a refresh token
func ValidateRefreshToken(tokenString string) (*Claims, error) {
	refreshSecret := os.Getenv("JWT_REFRESH_SECRET")
	if refreshSecret == "" {
		return nil, fmt.Errorf("JWT refresh secret not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(refreshSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("error parsing refresh token: %w", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid refresh token")
}

// getDurationFromEnv gets duration from environment variable with default
func getDurationFromEnv(key string, defaultMinutes int) time.Duration {
	if value := os.Getenv(key); value != "" {
		if minutes, err := strconv.Atoi(value); err == nil {
			return time.Duration(minutes) * time.Minute
		}
	}
	return time.Duration(defaultMinutes) * time.Minute
}