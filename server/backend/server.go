package backend

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type app struct{ db *pgxpool.Pool }

var server = sync.OnceValues(func() (http.Handler, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("POSTGRES_URL")
	}
	if dsn == "" {
		return nil, errors.New("database connection string is missing")
	}
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, errors.New("invalid database connection configuration")
	}
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec
	cfg.ConnConfig.ConnectTimeout = 8 * time.Second
	cfg.MaxConns = 4
	cfg.MinConns = 0
	cfg.MaxConnIdleTime = time.Minute
	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		return nil, errors.New("could not initialize database pool")
	}
	return (&app{db: pool}).routes(), nil
})

func ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if origin := r.Header.Get("Origin"); origin != "" && r.Method != http.MethodGet && r.Method != http.MethodHead {
		parsed, err := url.Parse(origin)
		if err != nil || (!strings.EqualFold(parsed.Host, r.Host) && r.Header.Get("Sec-Fetch-Site") != "same-origin") {
			writeError(w, problem(http.StatusForbidden, "Request origin is not allowed."))
			return
		}
	}
	h, err := server()
	if err != nil {
		writeError(w, problem(http.StatusServiceUnavailable, "The database is not configured."))
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 50*time.Second)
	defer cancel()
	h.ServeHTTP(w, r.WithContext(ctx))
}

type endpoint func(http.ResponseWriter, *http.Request) error
type privateEndpoint func(http.ResponseWriter, *http.Request, user) error

func (a *app) routes() http.Handler {
	mux := http.NewServeMux()
	add := func(pattern string, h endpoint) {
		mux.HandleFunc(pattern, func(w http.ResponseWriter, r *http.Request) {
			if err := h(w, r); err != nil {
				writeError(w, err)
			}
		})
	}
	private := func(h privateEndpoint) endpoint {
		return func(w http.ResponseWriter, r *http.Request) error {
			u, err := a.currentUser(r)
			if err != nil {
				return err
			}
			return h(w, r, u)
		}
	}
	add("GET /api/health", func(w http.ResponseWriter, r *http.Request) error {
		if err := a.db.Ping(r.Context()); err != nil {
			return problem(503, "Database unavailable.")
		}
		return respond(w, 200, map[string]string{"status": "ok"})
	})
	add("POST /api/auth/register", a.register)
	add("POST /api/auth/login", a.login)
	add("POST /api/auth/logout", a.logout)
	add("GET /api/auth/me", private(func(w http.ResponseWriter, r *http.Request, u user) error { return respond(w, 200, u) }))
	add("GET /api/users/me/forms", private(a.dashboard))
	add("POST /api/forms", private(a.create))
	add("POST /api/forms/ai", private(a.createAI))
	add("GET /api/forms/{slug}", a.getForm)
	add("PATCH /api/forms/{slug}", private(a.update))
	add("DELETE /api/forms/{slug}", private(a.remove))
	add("PATCH /api/forms/{slug}/open", private(a.status("open")))
	add("PATCH /api/forms/{slug}/close", private(a.status("closed")))
	add("POST /api/forms/{slug}/submit", a.submit)
	add("GET /api/forms/{slug}/submitted", a.submitted)
	add("GET /api/forms/{slug}/submissions", private(a.submissions))
	return mux
}

type apiError struct {
	status  int
	message string
}

func (e *apiError) Error() string           { return e.message }
func problem(status int, text string) error { return &apiError{status, text} }
func writeError(w http.ResponseWriter, err error) {
	var p *apiError
	if !errors.As(err, &p) {
		if errors.Is(err, pgx.ErrNoRows) {
			p = &apiError{404, "This item could not be found."}
		} else {
			var dbErr *pgconn.PgError
			if errors.As(err, &dbErr) {
				log.Printf("API database error: SQLSTATE %s", dbErr.Code)
			} else {
				log.Printf("API request failed (%T)", err)
			}
			p = &apiError{500, "The request could not be completed."}
		}
	}
	_ = respond(w, p.status, map[string]string{"error": p.message})
}
func respond(w http.ResponseWriter, status int, v any) error {
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(v)
}
func body(w http.ResponseWriter, r *http.Request, v any) error {
	media, _, _ := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if media != "application/json" {
		return problem(415, "Send a JSON request.")
	}
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	if err := dec.Decode(v); err != nil {
		return problem(400, "Invalid JSON request.")
	}
	if err := dec.Decode(new(any)); err != io.EOF {
		return problem(400, "Expected one JSON object.")
	}
	return nil
}
func token(size int) (string, error) {
	value := make([]byte, size)
	_, err := rand.Read(value)
	return base64.RawURLEncoding.EncodeToString(value), err
}
func digest(value string) []byte { hash := sha256.Sum256([]byte(value)); return hash[:] }
func cookie(w http.ResponseWriter, r *http.Request, name, value string, age int) {
	http.SetCookie(w, &http.Cookie{Name: name, Value: value, Path: "/", HttpOnly: true, Secure: r.TLS != nil || os.Getenv("VERCEL_ENV") == "production" || os.Getenv("VERCEL_ENV") == "preview", SameSite: http.SameSiteLaxMode, MaxAge: age})
}
func uniqueViolation(err error) bool {
	var e *pgconn.PgError
	return errors.As(err, &e) && e.Code == "23505"
}
