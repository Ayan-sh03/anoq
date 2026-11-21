package main

import (
	"log"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/ayan-sh03/anoq/server/backend"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	server := &http.Server{Addr: net.JoinHostPort("", port), Handler: http.HandlerFunc(backend.ServeHTTP), ReadHeaderTimeout: 10 * time.Second, ReadTimeout: 30 * time.Second, WriteTimeout: 60 * time.Second}
	log.Printf("Listening on port %s", port)
	log.Fatal(server.ListenAndServe())
}
