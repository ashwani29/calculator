package calculator

import (
	"errors"
	"math"
)

var ErrInvalidOperation = errors.New("unsupported operation")
var ErrMissingOperand = errors.New("missing operand")
var ErrDivisionByZero = errors.New("division by zero")
var ErrNegativeSquareRoot = errors.New("square root of a negative number")
var ErrNonFinite = errors.New("result is not a finite number")

func Calculate(operation string, a, b *float64) (float64, error) {
	if a == nil { return 0, ErrMissingOperand }
	var result float64
	switch operation {
	case "add", "subtract", "multiply", "divide", "power", "percent":
		if b == nil { return 0, ErrMissingOperand }
		switch operation {
		case "add": result = *a + *b
		case "subtract": result = *a - *b
		case "multiply": result = *a * *b
		case "divide":
			if *b == 0 { return 0, ErrDivisionByZero }; result = *a / *b
		case "power": result = math.Pow(*a, *b)
		case "percent": result = *a * *b / 100
		}
	case "sqrt":
		if *a < 0 { return 0, ErrNegativeSquareRoot }; result = math.Sqrt(*a)
	default: return 0, ErrInvalidOperation
	}
	if math.IsNaN(result) || math.IsInf(result, 0) { return 0, ErrNonFinite }
	return result, nil
}
