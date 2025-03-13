FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install necessary build tools
RUN apk add --no-cache git make

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api

# Create final lightweight image
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/main .

# Create non-root user
RUN adduser -D appuser
USER appuser

# Set environment variables
ENV PORT=8000

# Expose the application port
EXPOSE 8000

# Run the application
CMD ["./main"]
