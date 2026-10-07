package tests

import (
	"errors"
	"math"
	"testing"

	"github.com/ashwani29/calculator/backend/internal/calculator"
)

func floatPointer(value float64) *float64 { return &value }

func TestCalculate(t *testing.T) {
	tests := []struct {
		name      string
		operation string
		a, b      *float64
		want      float64
		wantErr   error
	}{
		{"addition", "add", floatPointer(2), floatPointer(3), 5, nil},
		{"subtraction", "subtract", floatPointer(2), floatPointer(5), -3, nil},
		{"multiplication", "multiply", floatPointer(4), floatPointer(3), 12, nil},
		{"division", "divide", floatPointer(9), floatPointer(3), 3, nil},
		{"power", "power", floatPointer(2), floatPointer(4), 16, nil},
		{"square root", "sqrt", floatPointer(81), nil, 9, nil},
		{"percentage", "percent", floatPointer(200), floatPointer(15), 30, nil},
		{"maximum operand is inclusive", "add", floatPointer(calculator.MaxOperandMagnitude), floatPointer(0), calculator.MaxOperandMagnitude, nil},
		{"minimum operand is inclusive", "add", floatPointer(-calculator.MaxOperandMagnitude), floatPointer(0), -calculator.MaxOperandMagnitude, nil},
		{"first operand above maximum", "add", floatPointer(calculator.MaxOperandMagnitude + 1), floatPointer(0), 0, calculator.ErrOperandOutOfRange},
		{"second operand below minimum", "add", floatPointer(0), floatPointer(-calculator.MaxOperandMagnitude - 1), 0, calculator.ErrOperandOutOfRange},
		{"non-finite operand", "add", floatPointer(math.Inf(1)), floatPointer(0), 0, calculator.ErrNonFiniteOperand},
		{"zero divisor", "divide", floatPointer(1), floatPointer(0), 0, calculator.ErrDivisionByZero},
		{"negative root", "sqrt", floatPointer(-1), nil, 0, calculator.ErrNegativeSquareRoot},
		{"missing operand", "add", floatPointer(1), nil, 0, calculator.ErrMissingOperand},
		{"missing value", "sqrt", nil, nil, 0, calculator.ErrMissingOperand},
		{"unknown operation", "mod", floatPointer(1), floatPointer(2), 0, calculator.ErrInvalidOperation},
		{"non-finite", "power", floatPointer(-1), floatPointer(0.5), 0, calculator.ErrNonFinite},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := calculator.Calculate(test.operation, test.a, test.b)
			if !errors.Is(err, test.wantErr) {
				t.Fatalf("error = %v, want %v", err, test.wantErr)
			}
			if err == nil && math.Abs(got-test.want) > 1e-9 {
				t.Errorf("result = %v, want %v", got, test.want)
			}
		})
	}
}
