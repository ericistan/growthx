import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('GrowthX starter', () => {
  it('identifies the Vite, React, Tailwind, and Cloudflare stack', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /growthx starter/i })).toBeInTheDocument()
    expect(screen.getByText(/vite \+ react \+ tailwind css/i)).toBeInTheDocument()
    expect(screen.getByText(/deployed on cloudflare workers/i)).toBeInTheDocument()
  })
})
