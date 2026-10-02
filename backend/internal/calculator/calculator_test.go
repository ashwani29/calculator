package calculator

import (
	"errors"
	"math"
	"testing"
)

func ptr(v float64) *float64 { return &v }

func TestCalculate(t *testing.T) {
	tests := []struct { name, op string; a, b *float64; want float64; err error }{
		{"addition", "add", ptr(2), ptr(3), 5, nil},
		{"subtraction", "subtract", ptr(2), ptr(5), -3, nil},
		{"multiplication", "multiply", ptr(4), ptr(3), 12, nil},
		{"division", "divide", ptr(9), ptr(3), 3, nil},
		{"power", "power", ptr(2), ptr(4), 16, nil},
		{"square root", "sqrt", ptr(81), nil, 9, nil},
		{"percentage", "percent", ptr(200), ptr(15), 30, nil},
		{"zero divisor", "divide", ptr(1), ptr(0), 0, ErrDivisionByZero},
		{"negative root", "sqrt", ptr(-1), nil, 0, ErrNegativeSquareRoot},
		{"missing operand", "add", ptr(1), nil, 0, ErrMissingOperand},
		{"missing value", "sqrt", nil, nil, 0, ErrMissingOperand},
		{"unknown operation", "mod", ptr(1), ptr(2), 0, ErrInvalidOperation},
		{"non-finite", "power", ptr(-1), ptr(0.5), 0, ErrNonFinite},
	}
	for _, tt := range tests { t.Run(tt.name, func(t *testing.T) {
		got, err := Calculate(tt.op, tt.a, tt.b)
		if !errors.Is(err, tt.err) { t.Fatalf("error = %v, want %v", err, tt.err) }
		if err == nil && math.Abs(got-tt.want) > 1e-9 { t.Errorf("result = %v, want %v", got, tt.want) }
	}) }
}
