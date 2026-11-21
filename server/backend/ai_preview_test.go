package backend

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

// A generated preview must never create a public form before the owner approves it.
func TestAIReviewBeforePublication(t *testing.T) {
	dsn := os.Getenv("ANOQ_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set ANOQ_TEST_DATABASE_URL to a PostgreSQL database with the Anoq schema")
	}
	ctx := t.Context()
	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal("could not open the test database")
	}
	defer db.Close()
	app := &app{db: db}
	nonce, err := token(12)
	if err != nil {
		t.Fatal(err)
	}
	owner := user{Email: nonce + "@example.invalid"}
	err = db.QueryRow(ctx, "INSERT INTO users(email,password_hash) VALUES($1,'unused') RETURNING id", owner.Email).Scan(&owner.ID)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		if _, err := db.Exec(ctx, "DELETE FROM users WHERE id=$1 AND email=$2", owner.ID, owner.Email); err != nil {
			t.Error(err)
		}
	}()
	t.Setenv("GOOGLE_GENERATIVE_AI_API_KEY", "local-test")
	previous := http.DefaultClient
	http.DefaultClient = &http.Client{Transport: transportFunc(func(*http.Request) (*http.Response, error) {
		body := `{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{\"title\":\"Onboarding\",\"questions\":[{\"question_text\":\"Was it easy?\"}]}"}]}}]}`
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body))}, nil
	})}
	defer func() { http.DefaultClient = previous }()

	for _, tc := range []struct {
		name, payload         string
		wantStatus, wantForms int
	}{
		{"preview", `{"prompt":"Onboarding study","preview_only":true}`, 200, 0},
		{"existing publishing client", `{"prompt":"Onboarding study"}`, 201, 1},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := db.Exec(ctx, "UPDATE users SET last_ai_request_at=NULL WHERE id=$1", owner.ID); err != nil {
				t.Fatal(err)
			}
			req := httptest.NewRequest(http.MethodPost, "/api/forms/ai", strings.NewReader(tc.payload))
			req.Header.Set("Content-Type", "application/json")
			response := httptest.NewRecorder()
			if err := app.createAI(response, req, owner); err != nil {
				t.Fatal(err)
			}
			var result form
			if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
				t.Fatal(err)
			}
			if result.Slug != "" {
				defer func() {
					del := httptest.NewRequest(http.MethodDelete, "/api/forms/"+result.Slug, nil)
					del.SetPathValue("slug", result.Slug)
					if err := app.remove(httptest.NewRecorder(), del, owner); err != nil {
						t.Error(err)
					}
				}()
			}
			var count int
			if err := db.QueryRow(ctx, "SELECT count(*) FROM forms WHERE author_id=$1", owner.ID).Scan(&count); err != nil {
				t.Fatal(err)
			}
			if response.Code != tc.wantStatus || count != tc.wantForms || (result.Slug == "") != (tc.wantForms == 0) || result.Title != "Onboarding" {
				t.Fatalf("received HTTP %d with %d saved forms and slug %q", response.Code, count, result.Slug)
			}
		})
	}
}
