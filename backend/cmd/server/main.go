package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/ashwani29/calculator/backend/internal/httpapi"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = ":8080"
	}

	logger.Info("calculator API starting", "addr", addr)
	if err := http.ListenAndServe(addr, httpapi.Handler(logger)); err != nil {
		logger.Error("calculator API stopped", "error", err)
		os.Exit(1)
	}
}
