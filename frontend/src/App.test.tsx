import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('calculator', () => {
  it('validates missing operands before calling the API', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock)
    render(<App />); fireEvent.click(screen.getByRole('button', { name: /calculate/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid first number.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends a calculation to the API and displays its result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 15 }) }))
    render(<App />); fireEvent.change(screen.getByLabelText('First number'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Second number'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }))
    expect(await screen.findByRole('status')).toHaveTextContent('15')
  })

  it('shows API errors clearly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'division by zero' }) }))
    render(<App />); fireEvent.click(screen.getByRole('button', { name: 'Divide' }))
    fireEvent.change(screen.getByLabelText('First number'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Second number'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('division by zero'))
  })
})
