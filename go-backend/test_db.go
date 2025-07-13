package main

import (
	"fmt"
	"log"

	"github.com/ayan-sh03/anoq/internal/config"
	"github.com/ayan-sh03/anoq/internal/db"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	fmt.Printf("Database config: %+v\n", cfg.Database)

	// Test database connection
	dbConfig := db.Config{
		Host:     cfg.Database.Host,
		Port:     fmt.Sprintf("%d", cfg.Database.Port),
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		Database: cfg.Database.Name,
		SSLMode:  cfg.Database.SSLMode,
	}

	database, err := db.New(dbConfig)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Close()

	fmt.Println("Database connection successful!")
}
