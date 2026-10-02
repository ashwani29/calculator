import { useState } from 'react'
import { calculate, type Operation } from './api'

const operations: { id: Operation; symbol: string; label: string; unary?: boolean }[] = [
  { id: 'add', symbol: '+', label: 'Add' }, { id: 'subtract', symbol: '−', label: 'Subtract' },
  { id: 'multiply', symbol: '×', label: 'Multiply' }, { id: 'divide', symbol: '÷', label: 'Divide' },
  { id: 'power', symbol: 'xʸ', label: 'Power' }, { id: 'sqrt', symbol: '√', label: 'Square root', unary: true },
  { id: 'percent', symbol: '%', label: 'Percent' },
]

function format(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value)
}

export default function App() {
  const [first, setFirst] = useState(''); const [second, setSecond] = useState('')
  const [operation, setOperation] = useState<Operation>('add')
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const unary = operation === 'sqrt'

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setResult(null)
    const a = Number(first); const b = Number(second)
    if (first.trim() === '' || !Number.isFinite(a)) { setError('Enter a valid first number.'); return }
    if (!unary && (second.trim() === '' || !Number.isFinite(b))) { setError('Enter a valid second number.'); return }
    setLoading(true)
    try { setResult(await calculate(operation, a, unary ? undefined : b)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to reach the calculator service.') }
    finally { setLoading(false) }
  }

  function clear() { setFirst(''); setSecond(''); setResult(null); setError('') }

  return <main className="page-shell">
    <header className="topbar"><a className="brand" href="#" aria-label="Orbit home"><span className="brand-mark">◉</span> orbit<span className="brand-dot">.</span></a><span className="top-caption">A little clarity, by the numbers.</span><span className="status"><i /> API ready</span></header>
    <section className="hero"><p className="eyebrow">THE EVERYDAY CALCULATOR</p><h1>Make numbers<br/><em>make sense.</em></h1><p className="intro">A calm space for quick calculations.<br className="desktop-break"/> Just the numbers you need, nothing you don’t.</p></section>
    <section className="calculator-card" aria-label="Calculator">
      <div className="card-head"><div><span className="step">01 <b> / </b> CALCULATE</span><h2>Let’s work it out.</h2></div><button className="clear-button" type="button" onClick={clear}>Clear <span>↗</span></button></div>
      <form onSubmit={submit}>
        <div className={`input-row ${unary ? 'unary' : ''}`}>
          <label className="number-field"><span>FIRST NUMBER</span><input aria-label="First number" inputMode="decimal" placeholder="0" value={first} onChange={e => setFirst(e.target.value)} /></label>
          {!unary && <label className="number-field"><span>SECOND NUMBER</span><input aria-label="Second number" inputMode="decimal" placeholder="0" value={second} onChange={e => setSecond(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.form?.requestSubmit() }} /></label>}
        </div>
        <div className="operation-header"><span>CHOOSE AN OPERATION</span><span>7 AVAILABLE</span></div>
        <div className="operations" role="group" aria-label="Choose an operation">{operations.map(item => <button type="button" key={item.id} aria-pressed={operation === item.id} className={`operation ${operation === item.id ? 'selected' : ''}`} onClick={() => { setOperation(item.id); setError(''); setResult(null) }}><span className="op-symbol">{item.symbol}</span><span>{item.label}</span></button>)}</div>
        {error && <p role="alert" className="error-message"><span>!</span>{error}</p>}
        {result !== null && <div className="result" role="status"><span>YOUR RESULT</span><strong>{format(result)}</strong></div>}
        <button className="calculate-button" type="submit" disabled={loading}>{loading ? 'Calculating…' : 'Calculate'} <span>→</span></button>
      </form>
      <p className="card-foot"><span>✳</span> Your calculations stay yours. Nothing is stored.</p>
    </section>
    <footer className="footer"><span>MADE FOR THE MOMENTS IN BETWEEN</span><span>ORBIT CALCULATOR <b>·</b> 2025</span></footer>
  </main>
}
