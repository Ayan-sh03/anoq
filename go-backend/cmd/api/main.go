package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"anoq/internal/database"
	"anoq/internal/handlers"
	"anoq/internal/middleware"
	"anoq/internal/repository"
	"anoq/internal/service"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
)

func main() {
	// Setup logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting server...")

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	// Initialize database connection
	db, err := database.NewConnection()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database connection: %v", err)
		}
	}()

	log.Println("Database connection established")

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	formRepo := repository.NewFormRepository(db)
	submissionRepo := repository.NewSubmissionRepository(db)

	// Initialize services
	userService := service.NewUserService(userRepo)
	formService := service.NewFormService(formRepo, userRepo)
	submissionService := service.NewSubmissionService(submissionRepo, formRepo)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService)
	formHandler := handlers.NewFormHandler(formService)
	submissionHandler := handlers.NewSubmissionHandler(submissionService)

	// Create Echo instance
	e := echo.New()
	e.HideBanner = true

	// Middleware
	e.Use(middleware.ErrorHandler())
	// e.Use(middleware.Auth())

	// Register routes
	userHandler.Register(e)
	formHandler.Register(e)
	submissionHandler.Register(e)

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "healthy",
			"version": "1.0.0",
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", port)
		if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Println("Shutting down server...")
	if err := e.Shutdown(ctx); err != nil {
		log.Fatal(err)
	}
}
