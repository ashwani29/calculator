package httpapi

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCalculateHandler(t *testing.T) {
	for _, tt := range []struct { name, body string; status int; expected string }{
		{"valid", `{"operation":"add","a":2,"b":3}`, 200, `"result":5`},
		{"invalid JSON", `{`, 400, `"error"`},
		{"missing operand", `{"operation":"sqrt"}`, 400, `"error"`},
		{"zero division", `{"operation":"divide","a":1,"b":0}`, 422, `"error":"division by zero"`},
		{"extra field", `{"operation":"add","a":2,"b":3,"x":1}`, 400, `"error"`},
	} { t.Run(tt.name, func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(tt.body))
		res := httptest.NewRecorder(); Handler().ServeHTTP(res, req)
		if res.Code != tt.status { t.Fatalf("status = %d, want %d (%s)", res.Code, tt.status, res.Body.String()) }
		if !strings.Contains(res.Body.String(), tt.expected) { t.Errorf("body %q does not contain %q", res.Body.String(), tt.expected) }
	}) }
}

func TestHealth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil); res := httptest.NewRecorder()
	Handler().ServeHTTP(res, req)
	if res.Code != http.StatusOK || !strings.Contains(res.Body.String(), `"status":"ok"`) { t.Fatalf("unexpected health response: %d %s", res.Code, res.Body.String()) }
}
