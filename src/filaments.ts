import { differenceCiede2000 } from 'culori'
import type { FilamentMaterialId, ProductModelDefinition, ProductPart } from './products'

const API_ROOT = 'https://filamentcolors.xyz/api'
const LIBRARY_ROOT = 'https://filamentcolors.xyz'
const AMAZON_TAG = 'capraaudio-20'
const CACHE_PREFIX = 'capra-filament-cache'

export type FilamentMaterial = {
  id: FilamentMaterialId
  label: string
  apiParent?: string
  search: string
}

export type FilamentSwatch = {
  id: number
  slug: string
  manufacturer: string
  colorName: string
  filamentType: string
  hex: string
  imageUrl?: string
  manufacturerPurchaseUrl?: string
}

export type FilamentCombination = {
  color: string
  material: FilamentMaterialId
  parts: ProductPart[]
}

export type FilamentRecommendation = FilamentCombination & {
  status: 'matched' | 'error'
  swatch?: FilamentSwatch
  error?: string
}

export const FILAMENT_MATERIALS: Record<FilamentMaterialId, FilamentMaterial> = {
  pla: { id: 'pla', label: 'PLA', apiParent: 'PLA', search: 'PLA' },
  petg: { id: 'petg', label: 'PETG', apiParent: 'PETG', search: 'PETG' },
  pctg: { id: 'pctg', label: 'PCTG', search: 'PCTG' },
  abs: { id: 'abs', label: 'ABS', apiParent: 'ABS / ASA', search: 'ABS' },
  asa: { id: 'asa', label: 'ASA', apiParent: 'ABS / ASA', search: 'ASA' },
  'tpu-95a': { id: 'tpu-95a', label: '95A TPU', apiParent: 'TPU / TPE', search: '95A TPU' },
}

type ApiSwatch = {
  id?: unknown
  slug?: unknown
  manufacturer?: { name?: unknown }
  color_name?: unknown
  filament_type?: { name?: unknown; parent_type?: { name?: unknown } }
  hex_color?: unknown
  card_img?: unknown
  image_front?: unknown
  mfr_purchase_link?: unknown
  is_available?: unknown
  published?: unknown
}

type ApiPage = { next?: string | null; results?: ApiSwatch[] }

let databaseVersionPromise: Promise<string> | undefined
const inventoryPromises = new Map<FilamentMaterialId, Promise<FilamentSwatch[]>>()
const colorDifference = differenceCiede2000()

function normalizedHex(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const clean = value.trim().replace(/^#/, '')
  return /^[0-9a-f]{6}$/i.test(clean) ? `#${clean.toUpperCase()}` : null
}

function normalizeSwatch(raw: ApiSwatch): FilamentSwatch | null {
  const hex = normalizedHex(raw.hex_color)
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id)
  const slug = typeof raw.slug === 'string' ? raw.slug : ''
  const manufacturer = typeof raw.manufacturer?.name === 'string' ? raw.manufacturer.name : ''
  const colorName = typeof raw.color_name === 'string' ? raw.color_name : ''
  const filamentType = typeof raw.filament_type?.name === 'string' ? raw.filament_type.name : ''
  if (!hex || !Number.isFinite(id) || !slug || !manufacturer || !colorName || !filamentType) return null
  return {
    id,
    slug,
    manufacturer,
    colorName,
    filamentType,
    hex,
    imageUrl: typeof raw.card_img === 'string' ? raw.card_img : typeof raw.image_front === 'string' ? raw.image_front : undefined,
    manufacturerPurchaseUrl: typeof raw.mfr_purchase_link === 'string' && /^https:\/\//i.test(raw.mfr_purchase_link)
      ? raw.mfr_purchase_link
      : undefined,
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`FilamentColors request failed (${response.status})`)
  return response.json() as Promise<T>
}

async function getDatabaseVersion() {
  databaseVersionPromise ??= fetchJson<{ db_version?: unknown; db_last_modified?: unknown }>(`${API_ROOT}/version/`)
    .then((value) => String(value.db_last_modified ?? value.db_version ?? 'unknown'))
    .catch(() => `daily-${new Date().toISOString().slice(0, 10)}`)
  return databaseVersionPromise
}

function inventoryMatches(material: FilamentMaterialId, filamentType: string) {
  const type = filamentType.toUpperCase()
  if (material === 'pctg') return /(^|[^A-Z])PCTG([^A-Z]|$)/.test(type)
  if (material === 'abs') return /(^|[^A-Z])ABS([^A-Z]|$)/.test(type) && !/(^|[^A-Z])ASA([^A-Z]|$)/.test(type)
  if (material === 'asa') return /(^|[^A-Z])ASA([^A-Z]|$)/.test(type)
  if (material === 'tpu-95a') return /95\s*A/.test(type) && /(TPU|TPE)/.test(type)
  return true
}

async function fetchInventory(material: FilamentMaterialId): Promise<FilamentSwatch[]> {
  const definition = FILAMENT_MATERIALS[material]
  const version = await getDatabaseVersion()
  const cacheKey = `${CACHE_PREFIX}:${version}:${material}`
  try {
    const cached = window.sessionStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached) as FilamentSwatch[]
  } catch { /* Matching still works when storage is unavailable. */ }

  const query = new URLSearchParams({ q: definition.search, page_size: '100' })
  if (definition.apiParent) query.set('filament_type__parent_type__name__iexact', definition.apiParent)
  let next: string | null = `${API_ROOT}/swatch/?${query}`
  const matches: FilamentSwatch[] = []
  const seen = new Set<number>()
  while (next) {
    const page: ApiPage = await fetchJson<ApiPage>(next)
    for (const raw of Array.isArray(page.results) ? page.results : []) {
      if (raw.is_available === false || raw.published === false) continue
      const swatch = normalizeSwatch(raw)
      if (!swatch || seen.has(swatch.id) || !inventoryMatches(material, swatch.filamentType)) continue
      seen.add(swatch.id)
      matches.push(swatch)
    }
    next = typeof page.next === 'string' ? page.next : null
  }
  try { window.sessionStorage.setItem(cacheKey, JSON.stringify(matches)) } catch { /* Ignore quota and privacy errors. */ }
  return matches
}

function getInventory(material: FilamentMaterialId) {
  let request = inventoryPromises.get(material)
  if (!request) {
    request = fetchInventory(material).catch((error) => {
      inventoryPromises.delete(material)
      throw error
    })
    inventoryPromises.set(material, request)
  }
  return request
}

async function bulkMatch(material: 'pla' | 'petg', colors: string[]) {
  const definition = FILAMENT_MATERIALS[material]
  const query = new URLSearchParams({
    colors: colors.join(','),
    materials: colors.map(() => definition.apiParent).join(','),
  })
  const response = await fetchJson<Record<string, ApiSwatch | null>>(`${API_ROOT}/swatch/bulk_colormatch/?${query}`)
  return new Map(colors.map((color) => [color, response[color] ? normalizeSwatch(response[color]!) : null]))
}

function closestSwatch(color: string, inventory: FilamentSwatch[]) {
  let best: FilamentSwatch | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const swatch of inventory) {
    const distance = colorDifference(color, swatch.hex)
    if (Number.isFinite(distance) && distance < bestDistance) {
      best = swatch
      bestDistance = distance
    }
  }
  return best
}

export function buildFilamentCombinations(
  model: ProductModelDefinition,
  colorway: Record<string, string>,
): FilamentCombination[] {
  const combinations = new Map<string, FilamentCombination>()
  for (const part of model.parts) {
    const color = normalizedHex(colorway[part.id] ?? model.defaultColors[part.id])
    if (!color) continue
    for (const material of part.allowedFilamentMaterials) {
      const key = `${color}:${material}`
      const existing = combinations.get(key)
      if (existing) existing.parts.push(part)
      else combinations.set(key, { color, material, parts: [part] })
    }
  }
  return [...combinations.values()].sort((a, b) => a.color.localeCompare(b.color) || a.material.localeCompare(b.material))
}

export async function findFilamentRecommendations(combinations: FilamentCombination[]): Promise<FilamentRecommendation[]> {
  const recommendations = new Map<string, FilamentRecommendation>()
  const materials = [...new Set(combinations.map((item) => item.material))]

  await Promise.all(materials.map(async (material) => {
    const relevant = combinations.filter((item) => item.material === material)
    const colors = [...new Set(relevant.map((item) => item.color))]
    try {
      let matches: Map<string, FilamentSwatch | null>
      if (material === 'pla' || material === 'petg') matches = await bulkMatch(material, colors)
      else {
        const inventory = await getInventory(material)
        matches = new Map(colors.map((color) => [color, closestSwatch(color, inventory) ?? null]))
      }
      for (const item of relevant) {
        const swatch = matches.get(item.color)
        recommendations.set(`${item.color}:${item.material}`, swatch
          ? { ...item, status: 'matched', swatch }
          : { ...item, status: 'error', error: `No ${FILAMENT_MATERIALS[item.material].label} match was found.` })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The filament service is unavailable.'
      for (const item of relevant) recommendations.set(`${item.color}:${item.material}`, { ...item, status: 'error', error: message })
    }
  }))

  return combinations.map((item) => recommendations.get(`${item.color}:${item.material}`)!)
}

export function filamentColorsSwatchUrl(swatch: FilamentSwatch) {
  return `${LIBRARY_ROOT}/swatch/${encodeURIComponent(swatch.slug)}/`
}

export function filamentColorsBrowseUrl(material: FilamentMaterialId) {
  return `${LIBRARY_ROOT}/library/?${new URLSearchParams({ f: FILAMENT_MATERIALS[material].search })}`
}

export function amazonAffiliateUrl(swatch: FilamentSwatch) {
  const keywords = `${swatch.manufacturer} ${swatch.colorName} ${swatch.filamentType} 1.75mm filament`
  return `https://www.amazon.com/s?${new URLSearchParams({ k: keywords, tag: AMAZON_TAG })}`
}

export function clearFilamentRequestCacheForTests() {
  databaseVersionPromise = undefined
  inventoryPromises.clear()
}
