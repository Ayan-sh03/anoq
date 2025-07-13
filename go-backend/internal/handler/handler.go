package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ayan-sh03/anoq/internal/db"
)

// HealthHandler handles health check requests
type HealthHandler struct {
	db *db.DB
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(database *db.DB) *HealthHandler {
	return &HealthHandler{
		db: database,
	}
}

// Health checks the health of the service
// @Summary Health check
// @Description Check if the service is running
// @Tags Health
// @Accept json
// @Produce json
// @Success 200 {object} object{status=string,service=string} "Service is healthy"
// @Router /health [get]
func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "anoq-backend",
	})
}

// Ready checks if the service is ready to receive traffic
// @Summary Readiness check
// @Description Check if the service is ready to receive traffic
// @Tags Health
// @Accept json
// @Produce json
// @Success 200 {object} object{status=string,service=string} "Service is ready"
// @Failure 503 {object} object{status=string,error=string} "Service not ready"
// @Router /ready [get]
func (h *HealthHandler) Ready(c *gin.Context) {
	// Check database connectivity
	if err := h.db.Health(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"error":  "database not available",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "ready",
		"service": "anoq-backend",
	})
}
