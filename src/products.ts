export type PartCategory = 'headband' | 'right-cup' | 'left-cup'

export type ProductPart = {
  id: string
  solidId: string
  name: string
  category: PartCategory
}

export type ColorOption = {
  id: string
  name: string
  hex: string
}

export type ProductModelDefinition = {
  id: string
  name: string
  assetUrl: string
  previewUrl: string
  maskUrl: (solidId: string) => string
  initialRotation: [number, number, number]
  parts: ProductPart[]
  defaultColors: Record<string, string>
  fixedColors: Record<string, string>
  metallicSolids: string[]
  fallbackFixedColor: string
}

export type ProductConfigV2 = {
  v: 2
  modelId: string
  colors: Record<string, string>
}

export const PART_CATEGORIES: Array<{ id: PartCategory; name: string }> = [
  { id: 'headband', name: 'Headband' },
  { id: 'right-cup', name: 'Right Cup' },
  { id: 'left-cup', name: 'Left Cup' },
]

export const COLORS: ColorOption[] = [
  { id: 'black', name: 'Black', hex: '#171719' },
  { id: 'red', name: 'Red', hex: '#E53935' },
  { id: 'orange', name: 'Orange', hex: '#FB8C00' },
  { id: 'yellow', name: 'Yellow', hex: '#FDD835' },
  { id: 'green', name: 'Green', hex: '#43A047' },
  { id: 'blue', name: 'Blue', hex: '#1E88E5' },
  { id: 'indigo', name: 'Indigo', hex: '#3949AB' },
  { id: 'violet', name: 'Violet', hex: '#8E24AA' },
]

const publicAsset = (fileName: string) => `./${fileName}`

const satyr4Parts: ProductPart[] = [
  { id: 'S000', solidId: 'S000', name: 'Headband', category: 'headband' },
  { id: 'S001', solidId: 'S001', name: 'Right Pivot Block', category: 'headband' },
  { id: 'S002', solidId: 'S002', name: 'Right Adjustment Arm', category: 'headband' },
  { id: 'S003', solidId: 'S003', name: 'Left Pivot Block', category: 'headband' },
  { id: 'S004', solidId: 'S004', name: 'Left Adjustment Arm', category: 'headband' },
  { id: 'S005', solidId: 'S005', name: 'Comfort Strap', category: 'headband' },
  { id: 'S006', solidId: 'S006', name: 'Right Housing', category: 'right-cup' },
  { id: 'S013', solidId: 'S013', name: 'Right Driver Retainer', category: 'right-cup' },
  { id: 'S014', solidId: 'S014', name: 'Right Baffle', category: 'right-cup' },
  { id: 'S015', solidId: 'S015', name: 'Right Pad Ring', category: 'right-cup' },
  { id: 'S016', solidId: 'S016', name: 'Right Yoke', category: 'right-cup' },
  { id: 'S017', solidId: 'S017', name: 'Right Inner Grille + Trim', category: 'right-cup' },
  { id: 'S018', solidId: 'S018', name: 'Right Outer Grille', category: 'right-cup' },
  { id: 'S021', solidId: 'S021', name: 'Right Spacer', category: 'right-cup' },
  { id: 'S046', solidId: 'S046', name: 'Left Housing', category: 'left-cup' },
  { id: 'S054', solidId: 'S054', name: 'Left Driver Retainer', category: 'left-cup' },
  { id: 'S055', solidId: 'S055', name: 'Left Baffle', category: 'left-cup' },
  { id: 'S056', solidId: 'S056', name: 'Left Pad Ring', category: 'left-cup' },
  { id: 'S059', solidId: 'S059', name: 'Left Yoke', category: 'left-cup' },
  { id: 'S060', solidId: 'S060', name: 'Left Inner Grille + Trim', category: 'left-cup' },
  { id: 'S061', solidId: 'S061', name: 'Left Outer Grille', category: 'left-cup' },
  { id: 'S063', solidId: 'S063', name: 'Left Spacer', category: 'left-cup' },
]

const satyr4Defaults: Record<string, string> = {
  S000: '#43A047',
  S001: '#E53935',
  S002: '#171719',
  S003: '#1E88E5',
  S004: '#171719',
  S005: '#171719',
  S006: '#171719',
  S013: '#171719',
  S014: '#171719',
  S015: '#43A047',
  S016: '#43A047',
  S017: '#43A047',
  S018: '#171719',
  S021: '#43A047',
  S046: '#171719',
  S054: '#171719',
  S055: '#171719',
  S056: '#43A047',
  S059: '#43A047',
  S060: '#43A047',
  S061: '#171719',
  S063: '#43A047',
}

export const SATYR_4: ProductModelDefinition = {
  id: 'satyr-4',
  name: 'Satyr 4',
  assetUrl: publicAsset('satyr-4-grouped.glb'),
  previewUrl: publicAsset('satyr-4-preview.png'),
  maskUrl: (solidId) => publicAsset(`mask-${solidId.toLowerCase()}.png`),
  initialRotation: [0.04, -0.18, 0],
  parts: satyr4Parts,
  defaultColors: satyr4Defaults,
  fixedColors: {
    S007: '#F6F6F3', S048: '#F6F6F3',
    S008: '#1E1E1E', S049: '#1E1E1E',
    S009: '#F3CB7C', S050: '#F3CB7C',
    S010: '#F5F5F6', S051: '#F5F5F6',
    S044: '#171719', S086: '#171719',
  },
  metallicSolids: ['S009', 'S010', 'S050', 'S051', 'S016', 'S017', 'S018', 'S059', 'S060', 'S061'],
  fallbackFixedColor: '#625F59',
}

export const PRODUCT_MODELS: ProductModelDefinition[] = [SATYR_4]
export const PRODUCT_MODEL_BY_ID = Object.fromEntries(PRODUCT_MODELS.map((model) => [model.id, model])) as Record<string, ProductModelDefinition>

export const LEGACY_COLORS: Record<string, string> = {
  ink: '#171719', oat: '#D8CDBB', clay: '#C66A47', moss: '#73816B',
  cobalt: '#3968B1', lilac: '#B0A0C9', cream: '#F0E9DA', rust: '#A8482E',
}

export const LEGACY_GROUPS: Record<string, string[]> = {
  headband: ['S000'],
  pivot: ['S001', 'S003'],
  adjustment: ['S002', 'S004'],
  strap: ['S005'],
  'right-housing': ['S006'],
  retainers: ['S013', 'S054'],
  baffles: ['S014', 'S055'],
  'pad-rings': ['S015', 'S056'],
  yokes: ['S016', 'S059'],
  'inner-grilles': ['S017', 'S060'],
  'outer-grilles': ['S018', 'S061'],
  spacers: ['S021', 'S063'],
  'left-housing': ['S046'],
}

export function normalizeHex(value: string): string | null {
  const clean = value.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return `#${clean.split('').map((character) => character.repeat(2)).join('').toUpperCase()}`
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) return `#${clean.toUpperCase()}`
  return null
}
