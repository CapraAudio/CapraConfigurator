export type PartCategory = 'headband' | 'right-cup' | 'left-cup'

export type FilamentMaterialId = 'pla' | 'petg' | 'pctg' | 'abs' | 'asa' | 'tpu-95a'

export type ProductPart = {
  id: string
  solidId: string
  name: string
  displayCode?: string
  hideSolidId?: boolean
  category: PartCategory
  allowedFilamentMaterials: FilamentMaterialId[]
}

export type ColorOption = {
  id: string
  name: string
  hex: string
}

export type ProductModelDefinition = {
  id: string
  name: string
  selectorLabel: string
  designer: string
  ownershipNotice: string
  isCapraHeadphone: boolean
  printFilesUrl: string
  printFilesSource: string
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
  { id: 'left-cup', name: 'Left Cup' },
  { id: 'headband', name: 'Headband' },
  { id: 'right-cup', name: 'Right Cup' },
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

const TPU_95A: FilamentMaterialId[] = ['tpu-95a']
const STRUCTURAL: FilamentMaterialId[] = ['petg', 'pctg', 'abs', 'asa']
const ADJUSTMENT: FilamentMaterialId[] = ['petg', 'pctg']
const CUP_PART: FilamentMaterialId[] = ['petg', 'pctg', 'abs', 'asa', 'pla']
const FLEXIBLE_CUP_PART: FilamentMaterialId[] = [...CUP_PART, 'tpu-95a']

const satyr4Parts: ProductPart[] = [
  { id: 'S000', solidId: 'S000', name: 'Headband', displayCode: 'H3-01', category: 'headband', allowedFilamentMaterials: TPU_95A },
  { id: 'S001', solidId: 'S001', name: 'Right Pivot Block', displayCode: 'H3-03.5', category: 'headband', allowedFilamentMaterials: STRUCTURAL },
  { id: 'S002', solidId: 'S002', name: 'Right Adjustment Arm', displayCode: 'H3-03', category: 'headband', allowedFilamentMaterials: ADJUSTMENT },
  { id: 'S003', solidId: 'S003', name: 'Left Pivot Block', displayCode: 'H3-03.5', category: 'headband', allowedFilamentMaterials: STRUCTURAL },
  { id: 'S004', solidId: 'S004', name: 'Left Adjustment Arm', displayCode: 'H3-03', category: 'headband', allowedFilamentMaterials: ADJUSTMENT },
  { id: 'S005', solidId: 'S005', name: 'Comfort Strap', displayCode: 'H3-02', category: 'headband', allowedFilamentMaterials: TPU_95A },
  { id: 'S006', solidId: 'S006', name: 'Right Housing', displayCode: 'S4-07', category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S013', solidId: 'S013', name: 'Right Driver Plate', displayCode: 'S4-05', category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S014', solidId: 'S014', name: 'Right Baffle', displayCode: 'S4-04', category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S015', solidId: 'S015', name: 'Right Baffle Rim', displayCode: 'S4-03', category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S016', solidId: 'S016', name: 'Right Yoke', displayCode: 'S4-01', category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S017', solidId: 'S017', name: 'Right Inner Grille - Trim', displayCode: 'S4-10+S4-09', category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S018', solidId: 'S018', name: 'Right Outer Grille', displayCode: 'S4-11', category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S021', solidId: 'S021', name: 'Right Spacer', displayCode: 'S4-06', category: 'right-cup', allowedFilamentMaterials: FLEXIBLE_CUP_PART },
  { id: 'S046', solidId: 'S046', name: 'Left Housing', displayCode: 'S4-08', category: 'left-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S054', solidId: 'S054', name: 'Left Driver Plate', displayCode: 'S4-05', category: 'left-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S055', solidId: 'S055', name: 'Left Baffle', displayCode: 'S4-04', category: 'left-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S056', solidId: 'S056', name: 'Left Baffle Rim', displayCode: 'S4-03', category: 'left-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S059', solidId: 'S059', name: 'Left Yoke', displayCode: 'S4-02', category: 'left-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S060', solidId: 'S060', name: 'Left Inner Grille + Trim', displayCode: 'S4-10+S4-09', category: 'left-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S061', solidId: 'S061', name: 'Left Outer Grille', displayCode: 'S4-11', category: 'left-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S063', solidId: 'S063', name: 'Left Spacer', displayCode: 'S4-06', category: 'left-cup', allowedFilamentMaterials: FLEXIBLE_CUP_PART },
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
  selectorLabel: 'Satyr 4',
  designer: 'Capra Audio',
  ownershipNotice: 'A Capra Audio headphone',
  isCapraHeadphone: true,
  printFilesUrl: 'https://www.printables.com/model/1548276-satyr-4-diy-hifi-headphones',
  printFilesSource: 'Printables',
  assetUrl: publicAsset('satyr-4-grouped.glb'),
  previewUrl: publicAsset('satyr-4-preview.png'),
  maskUrl: (solidId) => publicAsset(`mask-${solidId.toLowerCase()}.png`),
  initialRotation: [0.14, -0.61, 0],
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

const openOmegaParts: ProductPart[] = [
  { id: 'S000', solidId: 'S000', name: 'Headband', displayCode: 'H3-01', category: 'headband', allowedFilamentMaterials: TPU_95A },
  { id: 'S001', solidId: 'S001', name: 'Right Pivot Block', displayCode: 'H3-03.5', category: 'headband', allowedFilamentMaterials: STRUCTURAL },
  { id: 'S002', solidId: 'S002', name: 'Right Adjustment Arm', displayCode: 'H3-03', category: 'headband', allowedFilamentMaterials: ADJUSTMENT },
  { id: 'S003', solidId: 'S003', name: 'Left Pivot Block', displayCode: 'H3-03.5', category: 'headband', allowedFilamentMaterials: STRUCTURAL },
  { id: 'S004', solidId: 'S004', name: 'Left Adjustment Arm', displayCode: 'H3-03', category: 'headband', allowedFilamentMaterials: ADJUSTMENT },
  { id: 'S005', solidId: 'S005', name: 'Comfort Strap', displayCode: 'H3-02', category: 'headband', allowedFilamentMaterials: TPU_95A },
  { id: 'S006', solidId: 'S006', name: 'Right Yoke', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S008', solidId: 'S008', name: 'Right Cup', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S011', solidId: 'S011', name: 'Right Driver Cap', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S019', solidId: 'S019', name: 'Left Yoke', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S021', solidId: 'S021', name: 'Left Cup', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: CUP_PART },
  { id: 'S031', solidId: 'S031', name: 'Left Driver Cap', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: CUP_PART },
]

const openOmegaDefaults: Record<string, string> = {
  S000: '#E53935',
  S001: '#E53935',
  S002: '#383838',
  S003: '#1E88E5',
  S004: '#383838',
  S005: '#171719',
  S006: '#E53935',
  S008: '#383838',
  S011: '#E53935',
  S019: '#E53935',
  S021: '#383838',
  S031: '#E53935',
}

export const OPEN_OMEGA: ProductModelDefinition = {
  id: 'open-omega',
  name: 'Open-Omega',
  selectorLabel: 'Open-Omega — DMS',
  designer: 'DMS',
  ownershipNotice: 'Designed by DMS · Not a Capra headphone',
  isCapraHeadphone: false,
  printFilesUrl: 'https://github.com/DMS3tv/Open-Omega',
  printFilesSource: 'DMS GitHub',
  assetUrl: publicAsset('open-omega-grouped.glb'),
  previewUrl: publicAsset('open-omega-preview.png'),
  maskUrl: (solidId) => publicAsset(`mask-open-omega-${solidId.toLowerCase()}.png`),
  initialRotation: [0.14, -0.61, 0],
  parts: openOmegaParts,
  defaultColors: openOmegaDefaults,
  fixedColors: {
    S007: '#171719', S020: '#171719',
    S009: '#171719', S022: '#171719',
    S010: '#171719', S023: '#171719',
    S012: '#F6F6F3', S024: '#F6F6F3',
    S013: '#1E1E1E', S025: '#1E1E1E',
    S014: '#F3CB7C', S026: '#F3CB7C',
    S015: '#C8CDD1', S027: '#C8CDD1',
    S016: '#1E1E1E', S028: '#1E1E1E',
    S017: '#F6F6F3', S029: '#F6F6F3',
    S018: '#A0A0A0', S030: '#A0A0A0',
  },
  metallicSolids: ['S014', 'S015', 'S018', 'S026', 'S027', 'S030'],
  fallbackFixedColor: '#343438',
}

export const PRODUCT_MODELS: ProductModelDefinition[] = [SATYR_4, OPEN_OMEGA]
export const PRODUCT_MODEL_BY_ID = Object.fromEntries(PRODUCT_MODELS.map((model) => [model.id, model])) as Record<string, ProductModelDefinition>
export const DEFAULT_PRODUCT_MODEL = SATYR_4

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
