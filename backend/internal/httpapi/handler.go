package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/ashwani29/calculator/backend/internal/calculator"
)

type request struct { Operation string `json:"operation"`; A *float64 `json:"a"`; B *float64 `json:"b"` }
type response struct { Result *float64 `json:"result,omitempty"`; Error string `json:"error,omitempty"` }

func Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, http.StatusOK, map[string]string{"status":"ok"}) })
	mux.HandleFunc("POST /api/calculate", calculate)
	return cors(mux)
}

func calculate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var input request
	if err := decoder.Decode(&input); err != nil { writeJSON(w, http.StatusBadRequest, response{Error:"request must be valid JSON with numeric operands"}); return }
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF { writeJSON(w, http.StatusBadRequest, response{Error:"request must contain one JSON object"}); return }
	result, err := calculator.Calculate(input.Operation, input.A, input.B)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, calculator.ErrDivisionByZero) || errors.Is(err, calculator.ErrNegativeSquareRoot) { status = http.StatusUnprocessableEntity }
		writeJSON(w, status, response{Error:err.Error()}); return
	}
	writeJSON(w, http.StatusOK, response{Result:&result})
}

func writeJSON(w http.ResponseWriter, status int, body any) { w.Header().Set("Content-Type", "application/json"); w.WriteHeader(status); _ = json.NewEncoder(w).Encode(body) }

func cors(next http.Handler) http.Handler { return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions { w.WriteHeader(http.StatusNoContent); return }
	next.ServeHTTP(w, r)
}) }
