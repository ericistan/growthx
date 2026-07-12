import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from './App'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('landing-page audit flow', () => {
  it('starts with one URL input and one primary action', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /rebuild your landing page/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /landing page url/i })).toHaveAttribute(
      'placeholder',
      'https://yoursite.com',
    )
    expect(screen.getByRole('button', { name: /audit & rebuild/i })).toBeInTheDocument()
  })

  it('shows agent activity after a URL is submitted', () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.change(screen.getByRole('textbox', { name: /landing page url/i }), {
      target: { value: 'https://example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /audit & rebuild/i }))

    expect(screen.getByRole('heading', { name: /rebuilding example.com/i })).toBeInTheDocument()
    expect(screen.getByText('Auditing page structure')).toBeInTheDocument()
  })

  it('finishes with a before-and-after result and evidence', () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.change(screen.getByRole('textbox', { name: /landing page url/i }), {
      target: { value: 'https://example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /audit & rebuild/i }))

    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(screen.getByRole('heading', { name: /your rebuilt page is ready/i })).toBeInTheDocument()
    expect(screen.getByText('Original')).toBeInTheDocument()
    expect(screen.getByText('Rebuilt')).toBeInTheDocument()
    expect(screen.getByText('Message match')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view live preview/i })).toHaveAttribute('href')
  })
})
