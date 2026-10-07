package tests

import (
	"bytes"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ashwani29/calculator/backend/internal/httpapi"
)

func newTestHandler() http.Handler {
	logger := slog.New(slog.NewTextHandler(&bytes.Buffer{}, nil))
	return httpapi.Handler(logger)
}

func TestCalculateHandler(t *testing.T) {
	tests := []struct {
		name     string
		body     string
		status   int
		expected string
	}{
		{"valid", `{"operation":"add","a":2,"b":3}`, http.StatusOK, `"result":5`},
		{"invalid JSON", `{`, http.StatusBadRequest, `"error"`},
		{"string operand", `{"operation":"add","a":"2","b":3}`, http.StatusBadRequest, `"error":"field a must be a valid number"`},
		{"boolean operand", `{"operation":"add","a":2,"b":true}`, http.StatusBadRequest, `"error":"field b must be a valid number"`},
		{"non-string operation", `{"operation":7,"a":2,"b":3}`, http.StatusBadRequest, `"error":"field operation must be a string"`},
		{"missing operand", `{"operation":"sqrt"}`, http.StatusBadRequest, `"error"`},
		{"zero division", `{"operation":"divide","a":1,"b":0}`, http.StatusUnprocessableEntity, `"error":"division by zero"`},
		{"operand above maximum", `{"operation":"add","a":1000000000001,"b":1}`, http.StatusBadRequest, `"error":"operand must be between -1000000000000 and 1000000000000"`},
		{"extra field", `{"operation":"add","a":2,"b":3,"x":1}`, http.StatusBadRequest, `"error"`},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(test.body))
			response := httptest.NewRecorder()
			newTestHandler().ServeHTTP(response, request)
			if response.Code != test.status {
				t.Fatalf("status = %d, want %d (%s)", response.Code, test.status, response.Body.String())
			}
			if !strings.Contains(response.Body.String(), test.expected) {
				t.Errorf("body %q does not contain %q", response.Body.String(), test.expected)
			}
		})
	}
}

func TestHealth(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()
	newTestHandler().ServeHTTP(response, request)
	if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"status":"ok"`) {
		t.Fatalf("unexpected health response: %d %s", response.Code, response.Body.String())
	}
}

func TestRequestLoggerRecordsRequestMetadataWithoutOperands(t *testing.T) {
	var output bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&output, nil))
	request := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(`{"operation":"add","a":2,"b":3}`))
	response := httptest.NewRecorder()
	httpapi.Handler(logger).ServeHTTP(response, request)
	logLine := output.String()
	for _, expected := range []string{`"method":"POST"`, `"path":"/api/calculate"`, `"status":200`, `"duration_ms"`} {
		if !strings.Contains(logLine, expected) {
			t.Errorf("log %q does not contain %q", logLine, expected)
		}
	}
	if strings.Contains(logLine, `"a":2`) || strings.Contains(logLine, `"b":3`) {
		t.Errorf("log should not include request operands: %s", logLine)
	}
}
