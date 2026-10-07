package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/ashwani29/calculator/backend/internal/calculator"
)

const maxRequestBodySize = 1 << 20

type request struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b"`
}

type response struct {
	Result *float64 `json:"result,omitempty"`
	Error  string   `json:"error,omitempty"`
}

// Handler returns the calculator API with request logging and CORS middleware.
func Handler(logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("POST /api/calculate", calculate)

	return requestLogger(logger, cors(mux))
}

func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (w *statusRecorder) WriteHeader(status int) {
	if w.status != 0 {
		return
	}

	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *statusRecorder) Write(body []byte) (int, error) {
	if w.status == 0 {
		w.WriteHeader(http.StatusOK)
	}

	return w.ResponseWriter.Write(body)
}

func requestLogger(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		recorder := &statusRecorder{ResponseWriter: w}
		next.ServeHTTP(recorder, r)

		status := recorder.status
		if status == 0 {
			status = http.StatusOK
		}

		logger.Info(
			"http request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", status,
			"duration_ms", time.Since(started).Milliseconds(),
		)
	})
}

func calculate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	var input request
	if err := decoder.Decode(&input); err != nil {
		writeDecodeError(w, err)
		return
	}

	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		writeJSON(w, http.StatusBadRequest, response{Error: "request must contain one JSON object"})
		return
	}

	result, err := calculator.Calculate(input.Operation, input.A, input.B)
	if err != nil {
		writeCalculationError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, response{Result: &result})
}

func writeDecodeError(w http.ResponseWriter, err error) {
	var typeError *json.UnmarshalTypeError
	if !errors.As(err, &typeError) {
		writeJSON(w, http.StatusBadRequest, response{Error: "request body must be valid JSON"})
		return
	}

	message := "request contains a field with an invalid type"
	switch typeError.Field {
	case "operation":
		message = "field operation must be a string"
	case "a", "b":
		message = "field " + typeError.Field + " must be a valid number"
	}

	writeJSON(w, http.StatusBadRequest, response{Error: message})
}

func writeCalculationError(w http.ResponseWriter, err error) {
	status := http.StatusBadRequest
	if errors.Is(err, calculator.ErrDivisionByZero) || errors.Is(err, calculator.ErrNegativeSquareRoot) {
		status = http.StatusUnprocessableEntity
	}

	writeJSON(w, status, response{Error: err.Error()})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
