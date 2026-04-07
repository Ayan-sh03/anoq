package logger

import (
	"log"
	"os"
	"time"
)

type Logger struct {
	infoLogger  *log.Logger
	errorLogger *log.Logger
	debugLogger *log.Logger
}

var instance *Logger

func init() {
	instance = NewLogger()
}

func NewLogger() *Logger {
	// Create loggers with different prefixes
	infoLogger := log.New(os.Stdout, "[INFO] ", log.LstdFlags|log.Lshortfile)
	errorLogger := log.New(os.Stderr, "[ERROR] ", log.LstdFlags|log.Lshortfile)
	debugLogger := log.New(os.Stdout, "[DEBUG] ", log.LstdFlags|log.Lshortfile)

	return &Logger{
		infoLogger:  infoLogger,
		errorLogger: errorLogger,
		debugLogger: debugLogger,
	}
}

func GetLogger() *Logger {
	return instance
}

// Info logs informational messages
func (l *Logger) Info(message string, fields ...interface{}) {
	l.infoLogger.Printf("%s %v", message, fields)
}

// Error logs error messages
func (l *Logger) Error(message string, fields ...interface{}) {
	l.errorLogger.Printf("%s %v", message, fields)
}

// Debug logs debug messages (only in development)
func (l *Logger) Debug(message string, fields ...interface{}) {
	env := os.Getenv("ENVIRONMENT")
	if env != "production" && env != "prod" {
		if len(fields) > 0 {
			l.debugLogger.Printf("%s %v", message, fields)
		} else {
			l.debugLogger.Printf("%s", message)
		}
	}
}

// Warn logs warning messages
func (l *Logger) Warn(message string, fields ...interface{}) {
	log.Printf("[WARN] %s %v", message, fields)
}

// Fatal logs fatal errors and exits
func (l *Logger) Fatal(message string, fields ...interface{}) {
	l.errorLogger.Fatalf("%s %v", message, fields)
}

// LogHTTPRequest logs HTTP request details
func (l *Logger) LogHTTPRequest(method, path, userAgent, ip string, duration time.Duration) {
	l.infoLogger.Printf("HTTP %s %s - UserAgent: %s, IP: %s, Duration: %v",
		method, path, userAgent, ip, duration)
}

// LogAuthEvent logs authentication events
func (l *Logger) LogAuthEvent(event, email string, userID int, success bool) {
	status := "success"
	if !success {
		status = "failed"
	}
	l.infoLogger.Printf("Auth %s - Email: %s, UserID: %d, Status: %s",
		event, email, userID, status)
}

// LogDBQuery logs database queries (sanitized)
func (l *Logger) LogDBQuery(operation, table string, duration time.Duration) {
	if os.Getenv("ENVIRONMENT") != "production" {
		l.debugLogger.Printf("DB %s %s - Duration: %v", operation, table, duration)
	}
}

// LogError logs errors with context
func (l *Logger) LogError(context, operation string, err error) {
	l.errorLogger.Printf("Error in %s during %s: %v", context, operation, err)
}

// Convenience functions
func Info(message string, fields ...interface{}) {
	instance.Info(message, fields...)
}

func Error(message string, fields ...interface{}) {
	instance.Error(message, fields...)
}

func Debug(message string, fields ...interface{}) {
	instance.Debug(message, fields...)
}

func Warn(message string, fields ...interface{}) {
	instance.Warn(message, fields...)
}

func Fatal(message string, fields ...interface{}) {
	instance.Fatal(message, fields...)
}

func LogHTTPRequest(method, path, userAgent, ip string, duration time.Duration) {
	instance.LogHTTPRequest(method, path, userAgent, ip, duration)
}

func LogAuthEvent(event, email string, userID int, success bool) {
	instance.LogAuthEvent(event, email, userID, success)
}

func LogDBQuery(operation, table string, duration time.Duration) {
	instance.LogDBQuery(operation, table, duration)
}

func LogError(context, operation string, err error) {
	instance.LogError(context, operation, err)
}
