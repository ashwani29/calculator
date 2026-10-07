export type Operation = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'sqrt' | 'percent'

type CalculateResponse = {
  result?: number
  error?: string
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? ''

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  const response = await fetch(`${apiBaseUrl}/health`, { signal })
  return response.ok
}

export async function calculate(operation: Operation, a: number, b?: number): Promise<number> {
  const response = await fetch(`${apiBaseUrl}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, a, ...(b === undefined ? {} : { b }) }),
  })
  const payload = (await response.json()) as CalculateResponse

  if (!response.ok) {
    throw new Error(payload.error ?? 'Something went wrong. Please try again.')
  }
  if (typeof payload.result !== 'number' || !Number.isFinite(payload.result)) {
    throw new Error('The server returned an invalid result.')
  }

  return payload.result
}
