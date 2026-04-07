# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_NAME=anoq-api

# Docker parameters
DOCKER_COMPOSE=docker-compose

.PHONY: all build clean test deps run docker-build docker-run docker-stop docker-clean

all: deps build

build:
	$(GOBUILD) -o $(BINARY_NAME) -v ./cmd/api

clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)

test:
	$(GOTEST) -v ./...

deps:
	$(GOMOD) download
	$(GOMOD) tidy

run: build
	./$(BINARY_NAME)

# Docker commands
docker-build:
	$(DOCKER_COMPOSE) build

docker-run:
	$(DOCKER_COMPOSE) up -d

docker-stop:
	$(DOCKER_COMPOSE) down

docker-clean: docker-stop
	$(DOCKER_COMPOSE) down -v
	docker system prune -f

# Development helpers
dev:
	$(GOCMD) run ./cmd/api

migrate-up:
	@echo "Running database migrations..."
	@docker exec -it anoq-postgres psql -U postgres -d anoq -f /docker-entrypoint-initdb.d/000001_init_schema.up.sql

migrate-down:
	@echo "Rolling back database migrations..."
	@docker exec -it anoq-postgres psql -U postgres -d anoq -f /docker-entrypoint-initdb.d/000001_init_schema.down.sql

# Development containers
dev-up:
	@echo "Starting development environment..."
	$(DOCKER_COMPOSE) -f docker-compose.yml up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 5
	@make migrate-up
	@echo "Development environment is ready!"

dev-down:
	$(DOCKER_COMPOSE) -f docker-compose.yml down

dev-clean: dev-down
	$(DOCKER_COMPOSE) -f docker-compose.yml down -v

# Logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Help
help:
	@echo "Available commands:"
	@echo "  make build          - Build the application"
	@echo "  make clean         - Clean build files"
	@echo "  make test          - Run tests"
	@echo "  make deps          - Download dependencies"
	@echo "  make run           - Run the application locally"
	@echo "  make dev           - Run the application in development mode"
	@echo "  make docker-build  - Build Docker images"
	@echo "  make docker-run    - Run Docker containers"
	@echo "  make docker-stop   - Stop Docker containers"
	@echo "  make docker-clean  - Clean Docker resources"
	@echo "  make dev-up        - Start development environment"
	@echo "  make dev-down      - Stop development environment"
	@echo "  make dev-clean     - Clean development environment"
	@echo "  make migrate-up    - Run database migrations"
	@echo "  make migrate-down  - Rollback database migrations"
	@echo "  make logs          - View container logs"
