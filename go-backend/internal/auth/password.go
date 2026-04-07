package auth

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword generates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	if len(password) == 0 {
		return "", fmt.Errorf("password cannot be empty")
	}
	// bcrypt only uses the first 72 bytes; reject longer inputs to avoid silent truncation
	if len(password) > 72 {
		return "", fmt.Errorf("password exceeds bcrypt 72-byte limit")
	}
	// Generate hash with default cost (bcrypt.DefaultCost)
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("error hashing password: %w", err)
	}
	return string(hash), nil
}

// VerifyPassword compares a plain password with its hash
func VerifyPassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// IsValidPassword checks if password meets security requirements
func IsValidPassword(password string) bool {
	// Minimum 8 characters, at least one uppercase, one lowercase, one number
	if len(password) < 8 {
		return false
	}

	hasUpper := false
	hasLower := false
	hasNumber := false

	for _, char := range password {
		switch {
		case 'A' <= char && char <= 'Z':
			hasUpper = true
		case 'a' <= char && char <= 'z':
			hasLower = true
		case '0' <= char && char <= '9':
			hasNumber = true
		}
	}

	return hasUpper && hasLower && hasNumber
}

// IsStrongPassword provides additional password strength validation
func IsStrongPassword(password string) bool {
	if !IsValidPassword(password) {
		return false
	}

	// Additional checks for strong passwords
	if len(password) < 12 {
		return false
	}

	// Check for special characters
	hasSpecial := false
	specialChars := "!@#$%^&*()_+-=[]{}|;:,.<>?"

	for _, char := range password {
		for _, special := range specialChars {
			if char == special {
				hasSpecial = true
				break
			}
		}
		if hasSpecial {
			break
		}
	}

	return hasSpecial
}
