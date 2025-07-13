package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/rs/zerolog/log"
)

// DB wraps the database connection
type DB struct {
	*sqlx.DB
}

// Config holds database configuration
type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
	SSLMode  string
}

// New creates a new database connection
func New(config Config) (*DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.Database, config.SSLMode)

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Info().Str("host", config.Host).Str("port", config.Port).Str("database", config.Database).Msg("Connected to database")

	return &DB{
		DB: db,
	}, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	log.Info().Msg("Closing database connection")
	return db.DB.Close()
}

// Health checks the database connection health
func (db *DB) Health() error {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	return db.PingContext(ctx)
}

// WithTx executes a function within a database transaction
func (db *DB) WithTx(ctx context.Context, fn func(*sqlx.Tx) error) error {
	tx, err := db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				log.Error().Err(rollbackErr).Msg("Failed to rollback transaction after panic")
			}
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			log.Error().Err(rollbackErr).Msg("Failed to rollback transaction")
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// ExecContext executes a query with context
func (db *DB) ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	return db.DB.ExecContext(ctx, query, args...)
}

// GetContext gets a single record with context
func (db *DB) GetContext(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	return db.DB.GetContext(ctx, dest, query, args...)
}

// SelectContext gets multiple records with context
func (db *DB) SelectContext(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	return db.DB.SelectContext(ctx, dest, query, args...)
}

// IsUniqueViolation checks if the error is a unique constraint violation
func IsUniqueViolation(err error) bool {
	var pqErr *pq.Error
	// Use errors.As to check if the error is a pq.Error and get its code.
	if errors.As(err, &pqErr) {
		// PostgreSQL unique violation error code is "23505"
		return pqErr.Code == "23505"
	}
	return false
}

// IsForeignKeyViolation checks if the error is a foreign key constraint violation
func IsForeignKeyViolation(err error) bool {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		// PostgreSQL foreign key violation error code is "23503"
		return pqErr.Code == "23503"
	}
	return false
}

// IsNotFound checks if the error indicates no rows were found
func IsNotFound(err error) bool {
	return err == sql.ErrNoRows
}
