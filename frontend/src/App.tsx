import { useEffect, useState, type FormEvent } from 'react'
import { calculate, checkHealth, type Operation } from './api'

const operations: { id: Operation; symbol: string; label: string }[] = [
  { id: 'add', symbol: '+', label: 'Add' },
  { id: 'subtract', symbol: '−', label: 'Subtract' },
  { id: 'multiply', symbol: '×', label: 'Multiply' },
  { id: 'divide', symbol: '÷', label: 'Divide' },
  { id: 'power', symbol: 'xʸ', label: 'Power' },
  { id: 'sqrt', symbol: '√', label: 'Square root' },
  { id: 'percent', symbol: '%', label: 'Percent' },
]

const maxOperand = 1_000_000_000_000
const rangeError = 'Numbers must be between -1,000,000,000,000 and 1,000,000,000,000.'

function formatResult(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value)
}

export default function App() {
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [operation, setOperation] = useState<Operation>('add')
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking' | 'ready' | 'offline'>('checking')
  const unary = operation === 'sqrt'

  useEffect(() => {
    const controller = new AbortController()

    checkHealth(controller.signal)
      .then(online => setApiStatus(online ? 'ready' : 'offline'))
      .catch(() => {
        if (!controller.signal.aborted) setApiStatus('offline')
      })

    return () => controller.abort()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setResult(null)

    const a = Number(first)
    const b = Number(second)

    if (first.trim() === '' || !Number.isFinite(a)) {
      setError('Enter a valid first number.')
      return
    }
    if (Math.abs(a) > maxOperand) {
      setError(`First number is out of range. ${rangeError}`)
      return
    }
    if (!unary && (second.trim() === '' || !Number.isFinite(b))) {
      setError('Enter a valid second number.')
      return
    }
    if (!unary && Math.abs(b) > maxOperand) {
      setError(`Second number is out of range. ${rangeError}`)
      return
    }

    setLoading(true)
    try {
      setResult(await calculate(operation, a, unary ? undefined : b))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reach the calculator service.')
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setFirst('')
    setSecond('')
    setResult(null)
    setError('')
  }

  function chooseOperation(nextOperation: Operation) {
    setOperation(nextOperation)
    setError('')
    setResult(null)
  }

  const statusLabel = {
    checking: 'Checking API',
    ready: 'API ready',
    offline: 'API offline',
  }[apiStatus]

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Orbit home">
          <span className="brand-mark">◉</span> orbit<span className="brand-dot">.</span>
        </a>
        <span className="top-caption">A little clarity, by the numbers.</span>
        <span className={`status ${apiStatus}`} aria-label={`API status: ${apiStatus}`}>
          <i /> {statusLabel}
        </span>
      </header>

      <section className="hero">
        <p className="eyebrow">THE EVERYDAY CALCULATOR</p>
        <h1>
          Make numbers
          <br />
          <em>make sense.</em>
        </h1>
        <p className="intro">
          A calm space for quick calculations.
          <br className="desktop-break" /> Just the numbers you need, nothing you don’t.
        </p>
      </section>

      <section className="calculator-card" aria-label="Calculator">
        <div className="card-head">
          <div>
            <span className="step">01 <b> / </b> CALCULATE</span>
            <h2>Let’s work it out.</h2>
          </div>
          <button className="clear-button" type="button" onClick={clear}>
            Clear <span>↗</span>
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          <div className={`input-row ${unary ? 'unary' : ''}`}>
            <label className="number-field">
              <span>FIRST NUMBER</span>
              <input
                aria-label="First number"
                type="number"
                min={-maxOperand}
                max={maxOperand}
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={first}
                onChange={event => setFirst(event.target.value)}
              />
            </label>
            {!unary && (
              <label className="number-field">
                <span>SECOND NUMBER</span>
                <input
                  aria-label="Second number"
                  type="number"
                  min={-maxOperand}
                  max={maxOperand}
                  step="any"
                  inputMode="decimal"
                  placeholder="0"
                  value={second}
                  onChange={event => setSecond(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') event.currentTarget.form?.requestSubmit()
                  }}
                />
              </label>
            )}
          </div>

          <p className="input-hint">Allowed range: −1,000,000,000,000 to 1,000,000,000,000</p>

          <div className="operation-header">
            <span>CHOOSE AN OPERATION</span>
            <span>7 AVAILABLE</span>
          </div>
          <div className="operations" role="group" aria-label="Choose an operation">
            {operations.map(item => (
              <button
                type="button"
                key={item.id}
                aria-pressed={operation === item.id}
                className={`operation ${operation === item.id ? 'selected' : ''}`}
                onClick={() => chooseOperation(item.id)}
              >
                <span className="op-symbol">{item.symbol}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <p role="alert" className="error-message">
              <span>!</span>
              {error}
            </p>
          )}
          {result !== null && (
            <div className="result" role="status">
              <span>YOUR RESULT</span>
              <strong>{formatResult(result)}</strong>
            </div>
          )}

          <button className="calculate-button" type="submit" disabled={loading}>
            {loading ? 'Calculating…' : 'Calculate'} <span>→</span>
          </button>
        </form>

        <p className="card-foot">
          <span>✳</span> Your calculations stay yours. Nothing is stored.
        </p>
      </section>

      <footer className="footer">
        <span>MADE FOR THE MOMENTS IN BETWEEN</span>
        <span>
          ORBIT CALCULATOR <b>·</b> 2025
        </span>
      </footer>
    </main>
  )
}
