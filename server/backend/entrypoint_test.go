package backend_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	handler "github.com/ayan-sh03/anoq/api"
)

// Anonymous private requests exercise all the routing layers without opening a
// database connection. Vercel can pass either the original or rewritten path.
func TestVercelPrivateRoutes(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost:1/unused")
	for _, path := range []string{"/api/auth/me", "/api/dispatch?route=auth%2Fme", "/api/dispatch?route=users%2Fme%2Fforms", "/?route=auth%2Fme"} {
		t.Run(path, func(t *testing.T) {
			w := httptest.NewRecorder()
			handler.Handler(w, httptest.NewRequest(http.MethodGet, path, nil))
			if w.Code != http.StatusUnauthorized {
				t.Fatalf("GET %s returned %d, want 401", path, w.Code)
			}
			if w.Header().Get("Cache-Control") != "private, no-store" {
				t.Fatal("authenticated route must not be cached")
			}
		})
	}
}
