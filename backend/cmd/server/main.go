package main

import (
	"log"
	"net/http"
	"os"

	"github.com/ashwani29/calculator/backend/internal/httpapi"
)

func main() {
	addr := os.Getenv("ADDR")
	if addr == "" { addr = ":8080" }
	log.Printf("calculator API listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, httpapi.Handler()))
}
