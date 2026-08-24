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
import { OPEN_OMEGA, PRODUCT_MODEL_BY_ID } from '../src/products'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

beforeEach(() => {
  window.history.replaceState({}, '', '/')
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

describe('Open-Omega model', () => {
  it('registers the DMS model with unique customizable solids and complete defaults', () => {
    expect(PRODUCT_MODEL_BY_ID['open-omega']).toBe(OPEN_OMEGA)
    expect(OPEN_OMEGA.name).toBe('Open-Omega')
    expect(OPEN_OMEGA.designer).toBe('DMS')
    expect(OPEN_OMEGA.isCapraHeadphone).toBe(false)
    expect(new Set(OPEN_OMEGA.parts.map((part) => part.solidId)).size).toBe(OPEN_OMEGA.parts.length)
    expect(OPEN_OMEGA.parts).toHaveLength(12)
    expect(OPEN_OMEGA.defaultColors).toEqual({
      S000: '#E53935', S001: '#E53935', S002: '#383838', S003: '#1E88E5',
      S004: '#383838', S005: '#171719', S006: '#E53935', S008: '#383838',
      S011: '#E53935', S019: '#E53935', S021: '#383838', S031: '#E53935',
    })
    expect(OPEN_OMEGA.fixedColors).toMatchObject({
      S012: '#F6F6F3', S013: '#1E1E1E', S014: '#F3CB7C', S015: '#C8CDD1',
      S016: '#1E1E1E', S017: '#F6F6F3', S018: '#A0A0A0',
      S024: '#F6F6F3', S025: '#1E1E1E', S026: '#F3CB7C', S027: '#C8CDD1',
      S028: '#1E1E1E', S029: '#F6F6F3', S030: '#A0A0A0',
    })
    for (const part of OPEN_OMEGA.parts) {
      expect(OPEN_OMEGA.defaultColors[part.id]).toMatch(/^#[0-9A-F]{6}$/)
      expect(part.allowedFilamentMaterials.length).toBeGreaterThan(0)
    }
  })

  it('labels Open-Omega as a DMS design and not a Capra headphone', () => {
    render(<App />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Headphone model' }), { target: { value: 'open-omega' } })
    expect(screen.getByText('Open-Omega · 12 customizable parts')).toBeVisible()
    expect(screen.getAllByText('Designed by DMS · Not a Capra headphone').length).toBeGreaterThan(0)
  })

  it('uses a stable model link while keeping the base URL on Satyr 4', () => {
    const { unmount } = render(<App />)
    expect(screen.getByRole('combobox', { name: 'Headphone model' })).toHaveValue('satyr-4')
    expect(window.location.search).toBe('')
    unmount()

    window.history.replaceState({}, '', '/?model=open-omega')
    render(<App />)
    expect(screen.getByRole('combobox', { name: 'Headphone model' })).toHaveValue('open-omega')
    expect(screen.getByText('Open-Omega · 12 customizable parts')).toBeVisible()
  })

  it('keeps a permanent Satyr 4 link independent of the base URL default', () => {
    window.history.replaceState({}, '', '/?model=satyr-4')
    render(<App />)
    expect(screen.getByRole('combobox', { name: 'Headphone model' })).toHaveValue('satyr-4')
    expect(screen.getByText('Satyr 4 · 22 customizable parts')).toBeVisible()
    expect(screen.getByRole('link', { name: /Get print files Printables/i })).toHaveAttribute('href', 'https://www.printables.com/model/1548276-satyr-4-diy-hifi-headphones')
  })

  it('updates the model link when a model is selected', () => {
    render(<App />)
    const selector = screen.getByRole('combobox', { name: 'Headphone model' })
    fireEvent.change(selector, { target: { value: 'open-omega' } })
    expect(window.location.search).toBe('?model=open-omega')
    fireEvent.change(selector, { target: { value: 'satyr-4' } })
    expect(window.location.search).toBe('?model=satyr-4')
  })

  it('shows the selected model’s print-file source', () => {
    window.history.replaceState({}, '', '/?model=open-omega')
    render(<App />)
    expect(screen.getByRole('link', { name: /Get print files DMS GitHub/i })).toHaveAttribute('href', 'https://github.com/DMS3tv/Open-Omega')
  })
})
