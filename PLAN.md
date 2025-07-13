# EdgeDB to PostgreSQL Migration Plan

## Overview

This document outlines the plan to migrate from EdgeDB to PostgreSQL while switching to a Go backend implementation.

## Current System Architecture

### Database Schema (EdgeDB)
- User type with unique constraints
- Form type with relationships and auditing
- Filled_Form type for form submissions
- Question type for basic questions
- MultipleChoiceQuestion type extending Question

### API Routes
- Auth management (/api/auth)
- Dashboard operations (/api/dashboard)
- Form CRUD (/api/form)
- Response handling (/api/response)
- User management (/api/user)

## Migration Strategy

### 1. PostgreSQL Schema Design

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE form_status AS ENUM ('open', 'closed');

-- Base tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE,
    family_name VARCHAR(255),
    given_name VARCHAR(255)
);

CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author_id UUID REFERENCES users(id),
    description TEXT NOT NULL DEFAULT '',
    slug VARCHAR(255) UNIQUE NOT NULL,
    status form_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE RESTRICT,
    question_text TEXT NOT NULL,
    answer TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'basic'
);

CREATE TABLE multiple_choice_questions (
    question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    choices JSONB NOT NULL DEFAULT '[]',
    selected_choice JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE filled_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255),
    user_ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE filled_form_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filled_form_id UUID REFERENCES filled_forms(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    answer TEXT,
    selected_choices JSONB
);

-- Triggers for modified_at
CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_modified_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

CREATE TRIGGER update_filled_forms_modified_at
    BEFORE UPDATE ON filled_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();
```

### 2. Go Backend Structure

```
go-backend/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── db/
│   │   ├── db.go
│   │   └── migrations/
│   ├── handler/
│   │   ├── auth.go
│   │   ├── form.go
│   │   ├── response.go
│   │   └── user.go
│   ├── middleware/
│   │   ├── auth.go
│   │   └── ratelimit.go
│   ├── model/
│   │   ├── form.go
│   │   ├── question.go
│   │   └── user.go
│   └── repository/
│       ├── form.go
│       ├── question.go
│       └── user.go
├── pkg/
│   └── validator/
└── go.mod
```

### 3. Data Migration Process

1. **Export Data from EdgeDB**
   - Create an EdgeQL script to export all data in JSON format
   - Include all relationships and nested structures

2. **Transform Data**
   - Write a Go program to transform EdgeDB JSON to PostgreSQL compatible format
   - Handle UUID generation and relationship mapping
   - Preserve created_at and modified_at timestamps

3. **Import Data to PostgreSQL**
   - Use Go's database/sql package with lib/pq driver
   - Implement transaction-based imports
   - Validate data integrity after import

### 4. API Implementation (Go)

#### Key Packages
```go
// go.mod
module github.com/yourusername/formapp

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/lib/pq v1.10.9
    github.com/golang-migrate/migrate/v4 v4.17.0
    github.com/google/uuid v1.6.0
    github.com/jmoiron/sqlx v1.3.5
    github.com/lestrrat-go/jwx/v2 v2.0.21    // For JWT/JWKS handling
)
```

#### Models
```go
// model/form.go
type Form struct {
    ID          uuid.UUID  `json:"id" db:"id"`
    Title       string     `json:"title" db:"title"`
    AuthorID    uuid.UUID  `json:"author_id" db:"author_id"`
    Description string     `json:"description" db:"description"`
    Slug        string     `json:"slug" db:"slug"`
    Status      string     `json:"status" db:"status"`
    CreatedAt   time.Time  `json:"created_at" db:"created_at"`
    ModifiedAt  time.Time  `json:"modified_at" db:"modified_at"`
    Questions   []Question `json:"questions,omitempty"`
}

// model/question.go
type Question struct {
    ID           uuid.UUID `json:"id" db:"id"`
    FormID       uuid.UUID `json:"form_id" db:"form_id"`
    QuestionText string    `json:"question_text" db:"question_text"`
    Answer       *string   `json:"answer,omitempty" db:"answer"`
    Type         string    `json:"type" db:"type"`
}

type MultipleChoiceQuestion struct {
    Question
    Choices        []string `json:"choices" db:"choices"`
    SelectedChoice []string `json:"selected_choice" db:"selected_choice"`
}
```

### 5. API Endpoints

```go
// Webhook Implementation
type KindeWebhookHandler struct {
    userService UserService
    jwksClient  *jwx.Client
}

type KindeEvent struct {
    Type string `json:"type"`
    Data struct {
        User struct {
            Email     string `json:"email"`
            FirstName string `json:"first_name"`
            LastName  string `json:"last_name"`
        } `json:"user"`
    } `json:"data"`
}

func NewKindeWebhookHandler(userService UserService) *KindeWebhookHandler {
    // Initialize JWKS client with Kinde's JWKS endpoint
    jwksURL := fmt.Sprintf("%s/.well-known/jwks.json", os.Getenv("KINDE_ISSUER_URL"))
    jwksClient, err := jwx.NewClient(jwksURL)
    if err != nil {
        log.Fatalf("failed to create JWKS client: %v", err)
    }

    return &KindeWebhookHandler{
        userService: userService,
        jwksClient:  jwksClient,
    }
}

func (h *KindeWebhookHandler) HandleWebhook(c *gin.Context) {
    // 1. Read token from request body
    token, err := io.ReadAll(c.Request.Body)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
        return
    }

    // 2. Verify token signature
    event, err := h.verifyWebhookToken(string(token))
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
        return
    }

    // 3. Process event based on type
    switch event.Type {
    case "user.created":
        // Handle user creation
        user := &User{
            Email:      event.Data.User.Email,
            GivenName:  event.Data.User.FirstName,
            FamilyName: event.Data.User.LastName,
        }
        if err := h.userService.CreateUser(c.Request.Context(), user); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
    case "user.updated":
        // Handle user update similarly
        // This would update existing user information
    }

    c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func (h *KindeWebhookHandler) verifyWebhookToken(tokenString string) (*KindeEvent, error) {
    token, err := jwt.ParseUnverified(tokenString, &KindeEvent{})
    if err != nil {
        return nil, fmt.Errorf("failed to parse token: %w", err)
    }

    kid, ok := token.Header["kid"].(string)
    if !ok {
        return nil, errors.New("kid not found in token")
    }

    key, err := h.jwksClient.Get(kid)
    if err != nil {
        return nil, fmt.Errorf("failed to get key: %w", err)
    }

    var event KindeEvent
    parsedToken, err := jwt.ParseWithClaims(tokenString, &event, func(t *jwt.Token) (interface{}, error) {
        return key.Public(), nil
    })

    if err != nil || !parsedToken.Valid {
        return nil, fmt.Errorf("invalid token: %w", err)
    }

    return &event, nil
}

// Routes setup
func setupRoutes(r *gin.Engine) {
    api := r.Group("/api")
    {
        // Webhook endpoint for Kinde events
        api.POST("/sync-user", handler.WebhookHandler)

        // Form routes
        forms := api.Group("/form")
        {
            forms.GET("/", handler.ListForms)
            forms.POST("/", middleware.Auth(), handler.CreateForm)
            forms.GET("/:id", handler.GetForm)
            forms.PUT("/:id", middleware.Auth(), handler.UpdateForm)
            forms.DELETE("/:id", middleware.Auth(), handler.DeleteForm)
            forms.GET("/submissions/:slug", middleware.Auth(), handler.GetFormSubmissions)
        }

        // Response routes
        api.POST("/response", handler.SubmitResponse)

        // User routes
        api.GET("/user", middleware.Auth(), handler.GetUser)
    }
}
```

### 6. Testing Strategy

1. **Unit Tests**
   - Repository layer tests with sqlmock
   - Handler tests with httptest
   - Model validation tests

2. **Integration Tests**
   - API endpoints testing with test database
   - Authentication flow testing
   - Form submission flow testing

3. **Migration Tests**
   - Data integrity validation
   - Foreign key relationship validation
   - Constraint validation

### 7. Deployment Steps

1. **Database Migration**
   ```bash
   # Setup PostgreSQL
   psql -U postgres
   CREATE DATABASE formapp;

   # Run migrations
   go run cmd/migrate/main.go up
   ```

2. **Application Deployment**
   ```bash
   # Build Go application
   go build -o formapp cmd/server/main.go

   # Run with environment variables
   export DB_URL="postgres://user:pass@localhost:5432/formapp?sslmode=disable"
   ./formapp
   ```

3. **Frontend Updates**
   - Update API client to use new endpoints
   - Update authentication flow
   - Update form submission handling

### 8. Rollback Plan

1. **Database Rollback**
   - Keep EdgeDB instance running during migration
   - Maintain data backup before migration
   - Test rollback procedures before migration

2. **Application Rollback**
   - Keep previous version deployable
   - Maintain DNS/routing ability to switch back
   - Document all configuration changes

## Timeline Estimate

1. PostgreSQL Schema Setup: 1 day
2. Go Backend Implementation: 3-4 days
3. Data Migration Implementation: 1-2 days
4. Testing: 2-3 days
5. Deployment and Monitoring: 1 day

Total: 8-11 days

## Risks and Mitigations

1. **Data Loss**
   - Backup all EdgeDB data before migration
   - Validate data integrity after migration
   - Run test migrations with production data copy

2. **Performance Issues**
   - Benchmark current EdgeDB performance
   - Test PostgreSQL performance with similar data volume
   - Optimize indexes and queries

3. **Downtime**
   - Plan migration during low-traffic period
   - Implement blue-green deployment
   - Have rollback plan ready

## Success Criteria

1. All data successfully migrated with integrity
2. All API endpoints functional and tested
3. Frontend application working with new backend
4. Equal or better performance than EdgeDB
5. Zero data loss during migration
6. Monitoring and logging in place
7. Documentation updated

## Post-Migration Tasks

1. Monitor application performance
2. Gather error logs and metrics
3. Update documentation
4. Remove EdgeDB dependencies
5. Archive EdgeDB data and configuration