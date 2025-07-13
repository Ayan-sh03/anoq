package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/ayan-sh03/anoq/internal/config"
	"github.com/ayan-sh03/anoq/internal/repository"
)

// RateLimiter implements a sliding window rate limiter
type RateLimiter struct {
	requests      map[string]*ClientRequests
	mutex         sync.RWMutex
	cleanupTicker *time.Ticker
}

// ClientRequests tracks requests for a specific client
type ClientRequests struct {
	requests   []time.Time
	lastAccess time.Time
}

// RateLimit configuration
type RateLimitConfig struct {
	RequestsPerWindow int
	WindowDuration    time.Duration
	CleanupInterval   time.Duration
}

// Global rate limiters
var (
	generalLimiter  *RateLimiter
	formLimiter     *RateLimiter
	rateLimiterOnce sync.Once
)

// initRateLimiters initializes the global rate limiters
func initRateLimiters() {
	rateLimiterOnce.Do(func() {
		generalLimiter = NewRateLimiter(RateLimitConfig{
			RequestsPerWindow: 100,             // 100 requests
			WindowDuration:    time.Minute,     // per minute
			CleanupInterval:   5 * time.Minute, // cleanup every 5 minutes
		})

		formLimiter = NewRateLimiter(RateLimitConfig{
			RequestsPerWindow: 10,              // 10 form submissions
			WindowDuration:    time.Minute,     // per minute
			CleanupInterval:   5 * time.Minute, // cleanup every 5 minutes
		})
	})
}

// NewRateLimiter creates a new rate limiter with the given configuration
func NewRateLimiter(config RateLimitConfig) *RateLimiter {
	rl := &RateLimiter{
		requests:      make(map[string]*ClientRequests),
		cleanupTicker: time.NewTicker(config.CleanupInterval),
	}

	// Start cleanup goroutine
	go rl.cleanupLoop(config.CleanupInterval)

	return rl
}

// cleanupLoop removes old entries from the rate limiter
func (rl *RateLimiter) cleanupLoop(cleanupInterval time.Duration) {
	for {
		select {
		case <-rl.cleanupTicker.C:
			rl.cleanupOldEntries()
		}
	}
}

// cleanupOldEntries removes entries that haven't been accessed recently
func (rl *RateLimiter) cleanupOldEntries() {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	cutoff := time.Now().Add(-10 * time.Minute) // Remove entries older than 10 minutes
	for clientID, client := range rl.requests {
		if client.lastAccess.Before(cutoff) {
			delete(rl.requests, clientID)
		}
	}
}

// Allow checks if a request should be allowed based on rate limiting
func (rl *RateLimiter) Allow(clientID string, config RateLimitConfig) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	windowStart := now.Add(-config.WindowDuration)

	// Get or create client record
	client, exists := rl.requests[clientID]
	if !exists {
		client = &ClientRequests{
			requests: make([]time.Time, 0),
		}
		rl.requests[clientID] = client
	}

	// Update last access time
	client.lastAccess = now

	// Remove requests outside the window
	validRequests := make([]time.Time, 0)
	for _, reqTime := range client.requests {
		if reqTime.After(windowStart) {
			validRequests = append(validRequests, reqTime)
		}
	}
	client.requests = validRequests

	// Check if we're within the limit
	if len(client.requests) >= config.RequestsPerWindow {
		return false
	}

	// Add current request
	client.requests = append(client.requests, now)
	return true
}

// GetClientID extracts a unique identifier for rate limiting
func GetClientID(c *gin.Context) string {
	// Try to get authenticated user ID first
	if userID, exists := c.Get("user_id"); exists {
		return "user:" + userID.(string)
	}

	// Fall back to IP address
	return "ip:" + c.ClientIP()
}

// RequestID adds a unique request ID to each request
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := uuid.New().String()
		c.Header("X-Request-ID", requestID)
		c.Set("request_id", requestID)
		c.Next()
	}
}

// Logger logs HTTP requests
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Log request
		duration := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()

		if raw != "" {
			path = path + "?" + raw
		}

		log.Info().
			Str("method", method).
			Str("path", path).
			Int("status", statusCode).
			Str("ip", clientIP).
			Dur("duration", duration).
			Str("user_agent", c.Request.UserAgent()).
			Msg("HTTP Request")
	}
}

// RateLimit provides configurable rate limiting
func RateLimit(enabled bool) gin.HandlerFunc {
	if !enabled {
		return func(c *gin.Context) {
			c.Next()
		}
	}

	// Initialize rate limiters
	initRateLimiters()

	return func(c *gin.Context) {
		clientID := GetClientID(c)

		config := RateLimitConfig{
			RequestsPerWindow: 100,         // 100 requests
			WindowDuration:    time.Minute, // per minute
		}

		if !generalLimiter.Allow(clientID, config) {
			log.Warn().
				Str("client_id", clientID).
				Str("path", c.Request.URL.Path).
				Msg("Rate limit exceeded")

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":               "Rate limit exceeded",
				"message":             "Too many requests. Please try again later.",
				"retry_after_seconds": 60,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// FormRateLimit provides stricter rate limiting for form submissions
func FormRateLimit() gin.HandlerFunc {
	// Initialize rate limiters
	initRateLimiters()

	return func(c *gin.Context) {
		clientID := GetClientID(c)

		config := RateLimitConfig{
			RequestsPerWindow: 10,          // 10 form submissions
			WindowDuration:    time.Minute, // per minute
		}

		if !formLimiter.Allow(clientID, config) {
			log.Warn().
				Str("client_id", clientID).
				Str("path", c.Request.URL.Path).
				Msg("Form submission rate limit exceeded")

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":               "Form submission rate limit exceeded",
				"message":             "Too many form submissions. Please wait before submitting again.",
				"retry_after_seconds": 60,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// APIKeyRateLimit provides rate limiting based on API keys (for future use)
func APIKeyRateLimit(requestsPerMinute int) gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			c.Next()
			return
		}

		// Initialize rate limiters
		initRateLimiters()

		clientID := "api:" + apiKey
		config := RateLimitConfig{
			RequestsPerWindow: requestsPerMinute,
			WindowDuration:    time.Minute,
		}

		if !generalLimiter.Allow(clientID, config) {
			log.Warn().
				Str("api_key", apiKey).
				Str("path", c.Request.URL.Path).
				Msg("API key rate limit exceeded")

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":               "API rate limit exceeded",
				"message":             "API key rate limit exceeded. Please try again later.",
				"retry_after_seconds": 60,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Auth provides simple session-based authentication middleware
func Auth(cfg *config.Config, userRepo *repository.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract session token from Authorization header or Cookie
		var token string

		// Try Authorization header first
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			}
		}

		// Fall back to cookie if no header token
		if token == "" {
			if cookie, err := c.Cookie("session_token"); err == nil {
				token = cookie
			}
		}

		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authentication token"})
			c.Abort()
			return
		}

		// Get session from database
		session, err := userRepo.GetSessionByToken(c.Request.Context(), token)
		if err != nil {
			// Safe token logging (handle short tokens)
			tokenPreview := token
			if len(token) > 10 {
				tokenPreview = token[:10] + "..."
			}
			log.Debug().Err(err).Str("token", tokenPreview).Msg("Invalid session token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session"})
			c.Abort()
			return
		}

		// Get user from database
		user, err := userRepo.GetUserByID(c.Request.Context(), session.UserID)
		if err != nil {
			log.Error().Err(err).Str("user_id", session.UserID.String()).Msg("Failed to get user")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Set user information in context for handlers to use
		c.Set("user_id", user.ID.String())
		c.Set("user", user)
		c.Set("session", session)

		c.Next()
	}
}
