export type Operation = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'sqrt' | 'percent'

export async function calculate(operation: Operation, a: number, b?: number): Promise<number> {
  const base = import.meta.env.VITE_API_URL ?? ''
  const response = await fetch(`${base}/api/calculate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, a, ...(b === undefined ? {} : { b }) }),
  })
  const payload = await response.json() as { result?: number; error?: string }
  if (!response.ok) throw new Error(payload.error ?? 'Something went wrong. Please try again.')
  if (typeof payload.result !== 'number' || !Number.isFinite(payload.result)) throw new Error('The server returned an invalid result.')
  return payload.result
}
