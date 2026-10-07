package calculator

import (
	"errors"
	"math"
)

var (
	ErrInvalidOperation   = errors.New("unsupported operation")
	ErrMissingOperand     = errors.New("missing operand")
	ErrNonFiniteOperand   = errors.New("operand must be a finite number")
	ErrOperandOutOfRange  = errors.New("operand must be between -1000000000000 and 1000000000000")
	ErrDivisionByZero     = errors.New("division by zero")
	ErrNegativeSquareRoot = errors.New("square root of a negative number")
	ErrNonFinite          = errors.New("result is not a finite number")
)

// MaxOperandMagnitude bounds user input while staying well within float64's
// exact integer range. Results are separately checked for finiteness.
const MaxOperandMagnitude = 1_000_000_000_000

// Strategy defines how one calculator operation evaluates its operands.
type Strategy interface {
	Calculate(a float64, b *float64) (float64, error)
}

type BinaryStrategy func(a, b float64) (float64, error)

func (strategy BinaryStrategy) Calculate(a float64, b *float64) (float64, error) {
	if b == nil {
		return 0, ErrMissingOperand
	}
	return strategy(a, *b)
}

type UnaryStrategy func(a float64) (float64, error)

func (strategy UnaryStrategy) Calculate(a float64, _ *float64) (float64, error) {
	return strategy(a)
}

// strategies maps public operation names to their calculation behaviors.
var strategies = map[string]Strategy{
	"add": BinaryStrategy(func(a, b float64) (float64, error) {
		return a + b, nil
	}),
	"subtract": BinaryStrategy(func(a, b float64) (float64, error) {
		return a - b, nil
	}),
	"multiply": BinaryStrategy(func(a, b float64) (float64, error) {
		return a * b, nil
	}),
	"divide": BinaryStrategy(func(a, b float64) (float64, error) {
		if b == 0 {
			return 0, ErrDivisionByZero
		}
		return a / b, nil
	}),
	"power": BinaryStrategy(func(a, b float64) (float64, error) {
		return math.Pow(a, b), nil
	}),
	"percent": BinaryStrategy(func(a, b float64) (float64, error) {
		return a * b / 100, nil
	}),
	"sqrt": UnaryStrategy(func(a float64) (float64, error) {
		if a < 0 {
			return 0, ErrNegativeSquareRoot
		}
		return math.Sqrt(a), nil
	}),
}

func Calculate(operation string, a, b *float64) (float64, error) {
	if a == nil {
		return 0, ErrMissingOperand
	}
	if !isFinite(*a) || (b != nil && !isFinite(*b)) {
		return 0, ErrNonFiniteOperand
	}
	if math.Abs(*a) > MaxOperandMagnitude || (b != nil && math.Abs(*b) > MaxOperandMagnitude) {
		return 0, ErrOperandOutOfRange
	}
	strategy, ok := strategies[operation]
	if !ok {
		return 0, ErrInvalidOperation
	}
	result, err := strategy.Calculate(*a, b)
	if err != nil {
		return 0, err
	}
	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrNonFinite
	}
	return result, nil
}

func isFinite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}
