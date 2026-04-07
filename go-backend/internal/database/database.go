package database

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewConnection establishes a connection pool to the PostgreSQL database
func NewConnection() (*pgxpool.Pool, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "anoq_user")
	password := getEnv("DB_PASSWORD", "anoq_password")
	dbname := getEnv("DB_NAME", "anoq")

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable pool_max_conns=10 pool_min_conns=2 pool_max_conn_lifetime=1h pool_max_conn_idle_time=30m pool_health_check_period=5m",
		host, port, user, password, dbname,
	)

	db, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		return nil, fmt.Errorf("error creating connection pool: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.Ping(ctx); err != nil {
		return nil, fmt.Errorf("error connecting to the database: %w", err)
	}
	return db, nil
}

// getEnv retrieves environment variables with fallback values
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
