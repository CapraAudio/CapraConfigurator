import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  amazonAffiliateUrl,
  buildFilamentCombinations,
  clearFilamentRequestCacheForTests,
  findFilamentRecommendations,
  type FilamentSwatch,
} from '../src/filaments'
import { SATYR_4, type FilamentMaterialId } from '../src/products'

const apiSwatch = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  slug: 'maker-green-pctg-10',
  manufacturer: { name: 'Maker' },
  color_name: 'Green',
  filament_type: { name: 'PCTG', parent_type: { name: 'Exotics' } },
  hex_color: '42A148',
  card_img: 'https://filamentcolors.xyz/example.jpg',
  mfr_purchase_link: 'https://maker.example/green',
  is_available: true,
  published: true,
  ...overrides,
})

afterEach(() => {
  clearFilamentRequestCacheForTests()
  window.sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe('material metadata and grouping', () => {
  it('assigns the approved material lists to every solid', () => {
    const materials = Object.fromEntries(SATYR_4.parts.map((part) => [part.id, part.allowedFilamentMaterials]))
    expect(materials.S000).toEqual(['tpu-95a'])
    expect(materials.S001).toEqual(['petg', 'pctg', 'abs', 'asa'])
    expect(materials.S002).toEqual(['petg', 'pctg'])
    expect(materials.S005).toEqual(['tpu-95a'])
    expect(materials.S006).toEqual(['petg', 'pctg', 'abs', 'asa', 'pla'])
    expect(materials.S021).toEqual(['petg', 'pctg', 'abs', 'asa', 'pla', 'tpu-95a'])
    expect(materials.S046).toEqual(['petg', 'pctg', 'abs', 'asa', 'pla'])
    expect(materials.S063).toEqual(['petg', 'pctg', 'abs', 'asa', 'pla', 'tpu-95a'])
    expect(Object.keys(materials)).toHaveLength(22)
  })

  it('deduplicates identical color and material combinations while retaining parts', () => {
    const oneColor = Object.fromEntries(SATYR_4.parts.map((part) => [part.id, '#abcdef']))
    const combinations = buildFilamentCombinations(SATYR_4, oneColor)
    expect(combinations).toHaveLength(6)
    const flexible = combinations.find((item) => item.material === 'tpu-95a')
    expect(flexible?.color).toBe('#ABCDEF')
    expect(flexible?.parts.map((part) => part.id)).toEqual(['S000', 'S005', 'S021', 'S063'])
  })
})

describe('filament matching', () => {
  it('uses the server bulk matcher for broad PLA matches', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (!url.includes('bulk_colormatch')) throw new Error(`Unexpected URL ${url}`)
      return new Response(JSON.stringify({ '#43A047': apiSwatch({ filament_type: { name: 'PLA+', parent_type: { name: 'PLA' } } }) }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const results = await findFilamentRecommendations([{ color: '#43A047', material: 'pla', parts: [SATYR_4.parts[6]] }])
    expect(results[0].status).toBe('matched')
    expect(results[0].swatch?.filamentType).toBe('PLA+')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['pctg', 'PCTG', 'Nylon'] as const,
    ['abs', 'ABS-GF', 'ASA Pro'] as const,
    ['asa', 'ASA-CF', 'ABS+'] as const,
    ['tpu-95a', '95A TPU', '85A TPU'] as const,
  ])('filters subtype inventory for %s', async (material, accepted, rejected) => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/version/')) return new Response(JSON.stringify({ db_last_modified: 'test-version' }), { status: 200 })
      return new Response(JSON.stringify({ next: null, results: [
        apiSwatch({ id: 1, slug: 'rejected', filament_type: { name: rejected }, hex_color: '43A047' }),
        apiSwatch({ id: 2, slug: 'accepted', filament_type: { name: accepted }, hex_color: '44A148' }),
      ] }), { status: 200 })
    }))
    const results = await findFilamentRecommendations([{ color: '#43A047', material: material as FilamentMaterialId, parts: [SATYR_4.parts[0]] }])
    expect(results[0].swatch?.slug).toBe('accepted')
    expect(results[0].swatch?.filamentType).toBe(accepted)
  })

  it('returns retryable row errors instead of dropping combinations', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })))
    const results = await findFilamentRecommendations([{ color: '#43A047', material: 'pla', parts: [SATYR_4.parts[6]] }])
    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('error')
    expect(results[0].error).toContain('503')
  })
})

it('builds a tagged Amazon US search without claiming an exact product', () => {
  const swatch: FilamentSwatch = {
    id: 7,
    slug: 'maker-blue-petg',
    manufacturer: 'Maker Brand',
    colorName: 'Deep Blue',
    filamentType: 'PETG-CF',
    hex: '#123456',
  }
  const url = new URL(amazonAffiliateUrl(swatch))
  expect(url.origin).toBe('https://www.amazon.com')
  expect(url.searchParams.get('tag')).toBe('capraaudio-20')
  expect(url.searchParams.get('k')).toBe('Maker Brand Deep Blue PETG-CF 1.75mm filament')
})
