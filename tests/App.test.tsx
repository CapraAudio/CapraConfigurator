import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/filaments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/filaments')>()
  return { ...actual, findFilamentRecommendations: vi.fn().mockResolvedValue([]) }
})

import App from '../src/App'
import { findFilamentRecommendations } from '../src/filaments'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

beforeEach(() => {
  vi.mocked(findFilamentRecommendations).mockResolvedValue([])
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  })
  vi.stubGlobal('ResizeObserver', class ResizeObserver {
    observe() {}
    disconnect() {}
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(cleanup)

describe('Filament Finder interface', () => {
  it('shows the action and required affiliate disclosure', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Find Filaments' })).toBeVisible()
    expect(screen.getAllByText('As an Amazon Associate I earn from qualifying purchases.').length).toBeGreaterThan(0)
  })

  it('opens an accessible labelled dialog', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Find Filaments' }))
    expect(screen.getByRole('dialog', { name: 'Find Filaments' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Close filament finder' })).toHaveFocus()
  })
})
