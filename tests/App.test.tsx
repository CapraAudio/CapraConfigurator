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
import { MODEL_183X, OPEN_OMEGA, PRODUCT_MODEL_BY_ID, SATYR_4 } from '../src/products'

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
  it('links the Capra logo to the main Capra Audio website', () => {
    render(<App />)
    const brandLink = screen.getByRole('link', { name: 'Visit Capra Audio website' })
    expect(brandLink).toHaveAttribute('href', 'https://capraaudio.com/')
    expect(brandLink.querySelector('img')).toHaveAttribute('src', './capra-watermark.svg')
  })

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
    expect(OPEN_OMEGA.parts.filter((part) => part.category === 'headband').map((part) => part.displayCode)).toEqual([
      'H3-01', 'H3-03.5', 'H3-03', 'H3-03.5', 'H3-03', 'H3-02',
    ])
    expect(OPEN_OMEGA.parts.filter((part) => part.category !== 'headband').every((part) => part.hideSolidId)).toBe(true)
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

  it('shows headband guide codes but hides internal cup solid IDs', () => {
    window.history.replaceState({}, '', '/?model=open-omega')
    render(<App />)
    expect(screen.getByRole('button', { name: /Headband H3-01/ })).toBeVisible()
    fireEvent.click(screen.getByRole('tab', { name: 'Right Cup' }))
    expect(screen.getByRole('button', { name: 'Right Yoke' })).toBeVisible()
    expect(screen.queryByText('S006')).not.toBeInTheDocument()
  })
})

describe('Satyr 4 guide labels', () => {
  it('uses the guide names and display codes while retaining CAD solid IDs', () => {
    expect(Object.fromEntries(SATYR_4.parts.map((part) => [part.solidId, [part.name, part.displayCode]]))).toMatchObject({
      S000: ['Headband', 'H3-01'], S001: ['Right Pivot Block', 'H3-03.5'],
      S002: ['Right Adjustment Arm', 'H3-03'], S003: ['Left Pivot Block', 'H3-03.5'],
      S004: ['Left Adjustment Arm', 'H3-03'], S005: ['Comfort Strap', 'H3-02'],
      S006: ['Right Housing', 'S4-07'], S013: ['Right Driver Plate', 'S4-05'],
      S014: ['Right Baffle', 'S4-04'], S015: ['Right Baffle Rim', 'S4-03'],
      S016: ['Right Yoke', 'S4-01'], S017: ['Right Inner Grille - Trim', 'S4-10+S4-09'],
      S018: ['Right Outer Grille', 'S4-11'], S021: ['Right Spacer', 'S4-06'],
      S046: ['Left Housing', 'S4-08'], S054: ['Left Driver Plate', 'S4-05'],
      S055: ['Left Baffle', 'S4-04'], S056: ['Left Baffle Rim', 'S4-03'],
      S059: ['Left Yoke', 'S4-02'], S060: ['Left Inner Grille + Trim', 'S4-10+S4-09'],
      S061: ['Left Outer Grille', 'S4-11'], S063: ['Left Spacer', 'S4-06'],
    })
  })
})

describe('183X stock and replacement model', () => {
  it('registers 17 independently configurable replacement parts with corrected cup sides', () => {
    expect(PRODUCT_MODEL_BY_ID['183x']).toBe(MODEL_183X)
    expect(MODEL_183X.parts).toHaveLength(17)
    expect(MODEL_183X.parts.filter((part) => part.category === 'headband')).toHaveLength(5)
    expect(MODEL_183X.parts.filter((part) => part.category === 'left-cup')).toHaveLength(6)
    expect(MODEL_183X.parts.filter((part) => part.category === 'right-cup')).toHaveLength(6)
    expect(MODEL_183X.parts.every((part) => part.replacementSolidIds?.length === 1)).toBe(true)
    expect(MODEL_183X.parts.find((part) => part.id === '183X-A08')).toMatchObject({ name: 'Right Outer Grille', category: 'right-cup' })
    expect(MODEL_183X.parts.find((part) => part.id === '183X-B08')).toMatchObject({ name: 'Left Outer Grille', category: 'left-cup' })
    expect(MODEL_183X.defaultColors).toMatchObject({
      '183X-R-FWD': '#000000',
      '183X-R-REAR': '#E53935',
      '183X-L-FWD': '#000000',
      '183X-L-REAR': '#1E88E5',
    })
  })

  it('remains available by private route without appearing in the model selector', () => {
    window.history.replaceState({}, '', '/?model=183x')
    render(<App />)
    expect(screen.queryByRole('option', { name: '183X' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Private preview' })).toBeInTheDocument()
    expect(screen.getByText('183X · 17 customizable parts')).toBeVisible()
    expect(screen.queryByRole('link', { name: /Get print files/i })).not.toBeInTheDocument()
  })
})
