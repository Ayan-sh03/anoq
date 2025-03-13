# Anoq Backend

A Go backend service for the Anoq form application, providing REST APIs for form creation, management, and submission.

## Features

- User management (creation, authentication)
- Form creation and management
- Form submission handling
- PostgreSQL database integration
- Docker support
- Error handling middleware
- Authentication middleware

## Prerequisites

- Go 1.21 or higher
- PostgreSQL 15
- Docker (optional)
- Make (optional)

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd go-backend
```

2. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the PostgreSQL database:
```bash
make dev-up
```

4. Run the application:
```bash
make dev
```

### Docker Deployment

1. Build and start all services:
```bash
make docker-build
make docker-run
```

2. Stop services:
```bash
make docker-stop
```

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Forms
- `POST /api/forms` - Create a new form
- `GET /api/forms/:slug` - Get form details
- `PATCH /api/forms/:slug` - Update form
- `DELETE /api/forms/:slug` - Delete form
- `PATCH /api/forms/:slug/open` - Open form for submissions
- `PATCH /api/forms/:slug/close` - Close form for submissions

### Submissions
- `POST /api/forms/:slug/submit` - Submit a form
- `GET /api/forms/:slug/submissions` - Get all submissions for a form
- `GET /api/submissions/:id` - Get submission details
- `DELETE /api/submissions/:id` - Delete submission

## Development

### Project Structure
```
go-backend/
├── cmd/
│   └── api/            # Application entrypoint
├── internal/
│   ├── config/         # Configuration
│   ├── database/       # Database connection
│   ├── handlers/       # HTTP handlers
│   ├── middleware/     # Middleware components
│   ├── models/         # Data models
│   ├── repository/     # Database operations
│   └── service/        # Business logic
├── docker-compose.yml  # Docker compose configuration
├── Dockerfile         # Docker build configuration
├── Makefile          # Development commands
└── README.md         # This file
```

### Available Make Commands
- `make dev` - Run the application in development mode
- `make build` - Build the application
- `make test` - Run tests
- `make dev-up` - Start development environment
- `make dev-down` - Stop development environment
- `make docker-build` - Build Docker images
- `make docker-run` - Run Docker containers
- `make docker-stop` - Stop Docker containers
- `make migrate-up` - Run database migrations
- `make migrate-down` - Rollback database migrations

## Testing

Run all tests:
```bash
make test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
