import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from './App'

const POLL_INTERVAL_MS = 3000

class TestApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const baseRecord = {
  runId: 'run-1',
  targetUrl: 'https://example.com/',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const validOutput = {
  findings: [
    {
      id: 'finding-1',
      category: 'cta',
      severity: 'high',
      observation: 'The CTA is vague',
      evidence: 'The primary button says Learn More',
      recommendation: 'Use a specific action-oriented CTA',
      evidenceId: 'evidence-1',
    },
  ],
  evidence: [
    {
      id: 'evidence-1',
      claim: 'Specific CTAs convert better',
      sourceUrl: 'https://example.com/research',
      sourceTitle: 'Conversion research',
      excerpt: 'Specific CTAs reduce ambiguity.',
      retrievedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  variants: [
    { variant: 'a', hypothesis: 'Clarity', deploymentUrl: 'https://example.com/a/', qaStatus: 'pass' },
    { variant: 'b', hypothesis: 'Urgency', deploymentUrl: 'https://example.com/b/', qaStatus: 'pass' },
  ],
  qaReport: { status: 'pass', unsupportedClaims: [], brokenLinks: [], missingSections: [], notes: ['Real run QA note'] },
}

async function renderRealApp({ submitAudit, getAudit }) {
  vi.stubEnv('VITE_API_URL', 'http://test.local')
  vi.doMock('./api-client', () => ({ submitAudit, getAudit, ApiError: TestApiError }))
  vi.resetModules()
  const { default: RealApp } = await import('./App')
  render(<RealApp />)
}

function submitLandingPageUrl(value = 'https://example.com') {
  fireEvent.change(screen.getByRole('textbox', { name: /landing page url/i }), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: /audit & rebuild/i }))
}

afterEach(async () => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.doUnmock('./api-client')
  vi.resetModules()
})

describe('demo mode (no VITE_API_URL configured)', () => {
  it('starts with one URL input and one primary action', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /rebuild your landing page/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /landing page url/i })).toHaveAttribute(
      'placeholder',
      'https://yoursite.com',
    )
    expect(screen.getByRole('button', { name: /audit & rebuild/i })).toBeInTheDocument()
    expect(screen.getByText('Demo mode: on')).toBeInTheDocument()
  })

  it('shows agent activity after a URL is submitted', () => {
    vi.useFakeTimers()
    render(<App />)

    submitLandingPageUrl()

    expect(screen.getByRole('heading', { name: /rebuilding example.com/i })).toBeInTheDocument()
    expect(screen.getByText('Auditing page structure')).toBeInTheDocument()
  })

  it('finishes with mock findings, variants, and a QA banner', () => {
    vi.useFakeTimers()
    render(<App />)

    submitLandingPageUrl()

    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(screen.getByRole('heading', { name: /two rebuilt variants are live/i })).toBeInTheDocument()
    expect(screen.getByText('Variant A')).toBeInTheDocument()
    expect(screen.getByText('Variant B')).toBeInTheDocument()
    expect(screen.getAllByText('QA passed').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /open live/i }).length).toBeGreaterThan(0)
  })
})

describe('real mode (VITE_API_URL configured)', () => {
  it('submits a real run, polls status, and renders validated results', async () => {
    vi.useFakeTimers()
    const submitAudit = vi.fn().mockResolvedValue({ ...baseRecord, status: 'queued' })
    const getAudit = vi
      .fn()
      .mockResolvedValueOnce({ ...baseRecord, status: 'running' })
      .mockResolvedValueOnce({ ...baseRecord, status: 'completed', hermesRunId: 'hermes-1', output: JSON.stringify(validOutput) })

    await renderRealApp({ submitAudit, getAudit })
    submitLandingPageUrl()

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByRole('heading', { name: /rebuilding example.com/i })).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })

    expect(screen.getByRole('heading', { name: /two rebuilt variants are live/i })).toBeInTheDocument()
    expect(screen.getByText('Specific CTAs convert better')).toBeInTheDocument()
    expect(submitAudit).toHaveBeenCalledWith('https://example.com', { baseUrl: 'http://test.local' })
  })

  it('surfaces a submit error on the input screen', async () => {
    const submitAudit = vi.fn().mockRejectedValue(new TestApiError('Target host must resolve only to public IP addresses'))
    const getAudit = vi.fn()

    await renderRealApp({ submitAudit, getAudit })
    submitLandingPageUrl()

    expect(await screen.findByText('Target host must resolve only to public IP addresses')).toBeInTheDocument()
  })

  it('shows a failed-run screen when the run fails', async () => {
    vi.useFakeTimers()
    const submitAudit = vi.fn().mockResolvedValue({ ...baseRecord, status: 'queued' })
    const getAudit = vi.fn().mockResolvedValue({ ...baseRecord, status: 'failed', error: 'Hermes run cancelled' })

    await renderRealApp({ submitAudit, getAudit })
    submitLandingPageUrl()

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })

    expect(screen.getByRole('heading', { name: /we couldn.t finish auditing example\.com/i })).toBeInTheDocument()
    expect(screen.getByText('Hermes run cancelled')).toBeInTheDocument()
  })

  it('falls back to a raw-output view when the completed output does not validate, without showing mock data', async () => {
    vi.useFakeTimers()
    const submitAudit = vi.fn().mockResolvedValue({ ...baseRecord, status: 'queued' })
    const getAudit = vi.fn().mockResolvedValue({
      ...baseRecord,
      status: 'completed',
      hermesRunId: 'hermes-1',
      output: 'not json',
    })

    await renderRealApp({ submitAudit, getAudit })
    submitLandingPageUrl()

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })

    expect(screen.getByRole('heading', { name: /couldn.t render a structured result/i })).toBeInTheDocument()
    expect(screen.getByText('not json')).toBeInTheDocument()
    expect(screen.getByText(/hermes run id: hermes-1/i)).toBeInTheDocument()
    expect(screen.queryByText('Variant A')).not.toBeInTheDocument()
  })
})
