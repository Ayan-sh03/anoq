// Package handler exposes the Go API as a Vercel Function.
package handler

import (
	"net/http"

	"github.com/ayan-sh03/anoq/server/backend"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	if route := r.URL.Query().Get("route"); route != "" && (r.URL.Path == "/api/dispatch" || r.URL.Path == "/api/dispatch.go" || r.URL.Path == "/api" || r.URL.Path == "/api/" || r.URL.Path == "/") {
		r = r.Clone(r.Context())
		r.URL.Path = "/api/" + route
		r.URL.RawPath = ""
	}
	backend.ServeHTTP(w, r)
}
