export type PartCategory = 'headband' | 'right-cup' | 'left-cup'

export type FilamentMaterialId = 'pla' | 'petg' | 'pctg' | 'abs' | 'asa' | 'tpu-95a'

export type ProductPart = {
  id: string
  solidId: string
  stockSolidIds?: string[]
  replacementSolidIds?: string[]
  stockAccessorySolidIds?: string[]
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
  hiddenSolidIds?: string[]
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

const MODEL_183X_RIGID: FilamentMaterialId[] = ['petg', 'pctg', 'abs', 'asa', 'pla']
const model183xParts: ProductPart[] = [
  { id: '183X-H02', solidId: 'S041', stockSolidIds: ['S041'], replacementSolidIds: ['R042'], name: 'Comfort Strap', hideSolidId: true, category: 'headband', allowedFilamentMaterials: TPU_95A },
  { id: '183X-H03-R', solidId: 'S064', stockSolidIds: ['S064'], replacementSolidIds: ['R054'], name: 'Right Rear Clasp', hideSolidId: true, category: 'headband', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-H03-L', solidId: 'S052', stockSolidIds: ['S052'], replacementSolidIds: ['R055'], name: 'Left Rear Clasp', hideSolidId: true, category: 'headband', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-H04-R', solidId: 'S059', stockSolidIds: ['S059'], replacementSolidIds: ['R048'], stockAccessorySolidIds: ['S048', 'S049', 'S050', 'S051'], name: 'Right Front Cover', hideSolidId: true, category: 'headband', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-H04-L', solidId: 'S054', stockSolidIds: ['S054'], replacementSolidIds: ['R049'], stockAccessorySolidIds: ['S042', 'S043', 'S044', 'S045', 'S046', 'S047'], name: 'Left Front Cover', hideSolidId: true, category: 'headband', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-A02', solidId: 'S011', stockSolidIds: ['S011'], replacementSolidIds: ['R011'], name: 'Right Driver Retention', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-A06', solidId: 'S019', stockSolidIds: ['S019'], replacementSolidIds: ['R019'], name: 'Right Yoke Shell', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-R-FWD', solidId: 'S020', stockSolidIds: ['S020'], replacementSolidIds: ['R020'], name: 'Right Forward Yoke Spacer', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-R-REAR', solidId: 'S021', stockSolidIds: ['S021'], replacementSolidIds: ['R021'], name: 'Right Rear Yoke Spacer', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-A07', solidId: 'S022', stockSolidIds: ['S022'], replacementSolidIds: ['R022'], name: 'Right Fascia Trim', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-A08', solidId: 'S023', stockSolidIds: ['S023'], replacementSolidIds: ['R023'], name: 'Right Outer Grille', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-B02', solidId: 'S076', stockSolidIds: ['S076'], replacementSolidIds: ['R068'], name: 'Left Driver Retention', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-B06', solidId: 'S087', stockSolidIds: ['S087'], replacementSolidIds: ['R082'], name: 'Left Yoke Shell', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-L-FWD', solidId: 'S088', stockSolidIds: ['S088'], replacementSolidIds: ['R084'], name: 'Left Forward Yoke Spacer', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-L-REAR', solidId: 'S089', stockSolidIds: ['S089'], replacementSolidIds: ['R085'], name: 'Left Rear Yoke Spacer', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-B07', solidId: 'S090', stockSolidIds: ['S090'], replacementSolidIds: ['R086'], name: 'Left Fascia Trim', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
  { id: '183X-B08', solidId: 'S091', stockSolidIds: ['S091'], replacementSolidIds: ['R087'], name: 'Left Outer Grille', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: MODEL_183X_RIGID },
]

const model183xDefaults: Record<string, string> = {
  '183X-H02': '#272727',
  '183X-H03-L': '#000000',
  '183X-H03-R': '#000000',
  '183X-H04-L': '#000000',
  '183X-H04-R': '#000000',
  '183X-A02': '#000000',
  '183X-A06': '#000000',
  '183X-R-FWD': '#000000',
  '183X-R-REAR': '#E53935',
  '183X-A07': '#646464',
  '183X-A08': '#000000',
  '183X-B02': '#000000',
  '183X-B06': '#000000',
  '183X-L-FWD': '#000000',
  '183X-L-REAR': '#1E88E5',
  '183X-B07': '#646464',
  '183X-B08': '#000000',
}

const model183xFixedColors: Record<string, string> = {}
function setModel183xColors(color: string, solids: number[]) {
  solids.forEach((solid) => { model183xFixedColors[`S${String(solid).padStart(3, '0')}`] = color })
}
setModel183xColors('#9A9EA3', [0, 1, 2, 3, 65, 66, 67, 68])
setModel183xColors('#74787D', [9, 10, 13, 14, 15, 16, 17, 18, ...Array.from({ length: 15 }, (_, index) => index + 24), 57, 63, 74, 75, 78, 81, 82, 83, 84, 85, 86])
setModel183xColors('#000000', [4, 11, 12, 19, 23, 39, 52, 54, 59, 64, 69, 76, 77, 87, 91, 92])
setModel183xColors('#F6F6F3', [5, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 55, 56, 60, 61, 62, 70, 79, 80])
setModel183xColors('#85898E', [40, 53, 58])
setModel183xColors('#1E1E1E', [6, 71])
setModel183xColors('#646464', [22, 90])
setModel183xColors('#F3CB7C', [7, 72])
setModel183xColors('#F5F5F6', [8, 73])
setModel183xColors('#272727', [41])

export const MODEL_183X: ProductModelDefinition = {
  id: '183x',
  name: '183X',
  selectorLabel: '183X',
  designer: 'Capra Audio',
  ownershipNotice: 'A Capra Audio headphone',
  isCapraHeadphone: true,
  printFilesUrl: '',
  printFilesSource: '',
  assetUrl: publicAsset('183x-stock-replacement.glb'),
  previewUrl: publicAsset('183x-preview.png'),
  maskUrl: (partId) => publicAsset(`mask-183x-${partId.toLowerCase()}.png`),
  initialRotation: [0.14, 2.35, 0],
  parts: model183xParts,
  defaultColors: model183xDefaults,
  fixedColors: model183xFixedColors,
  // Stock badge lettering stays hidden until the product is publicly released.
  hiddenSolidIds: ['S042', 'S043', 'S044', 'S045', 'S046', 'S047', 'S048', 'S049', 'S050', 'S051'],
  metallicSolids: [
    'S000', 'S001', 'S002', 'S003', 'S007', 'S008', 'S009', 'S010',
    'S014', 'S015', 'S016', 'S017', 'S018', 'S022', 'S023',
    ...Array.from({ length: 15 }, (_, index) => `S${String(index + 24).padStart(3, '0')}`),
    'S040', 'S053', 'S057', 'S058', 'S063', 'S065', 'S066', 'S067', 'S068',
    'S074', 'S075', 'S081', 'S082', 'S083', 'S084', 'S085', 'S086', 'S090', 'S091',
  ],
  fallbackFixedColor: '#74787D',
}

const HEADAMAME_RIGID: FilamentMaterialId[] = ['petg', 'pctg', 'abs', 'asa', 'pla']
const headamameV2Parts: ProductPart[] = [
  { id: 'S002', solidId: 'S002', name: 'Left Headband Cover', hideSolidId: true, category: 'headband', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S003', solidId: 'S003', name: 'Left Headband Clamp', hideSolidId: true, category: 'headband', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S004', solidId: 'S004', name: 'Headband Spring', hideSolidId: true, category: 'headband', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S005', solidId: 'S005', name: 'Right Headband Cover', hideSolidId: true, category: 'headband', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S006', solidId: 'S006', name: 'Right Headband Clamp', hideSolidId: true, category: 'headband', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S000', solidId: 'S000', name: 'Left Earpad Mount', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S001', solidId: 'S001', name: 'Left 50 mm Driver Mount', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S008', solidId: 'S008', name: 'Left Outer Cone', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S010', solidId: 'S010', name: 'Left Cone Face', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S011', solidId: 'S011', name: 'Left Headband Mount', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S013', solidId: 'S013', name: 'Left Cup Clamp', hideSolidId: true, category: 'left-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S017', solidId: 'S017', name: 'Right Earpad Mount', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S021', solidId: 'S021', name: 'Right 50 mm Driver Mount', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S019', solidId: 'S019', name: 'Right Outer Cone', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S016', solidId: 'S016', name: 'Right Cone Face', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S015', solidId: 'S015', name: 'Right Headband Mount', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
  { id: 'S014', solidId: 'S014', name: 'Right Cup Clamp', hideSolidId: true, category: 'right-cup', allowedFilamentMaterials: HEADAMAME_RIGID },
]

export const HEADAMAME_V2: ProductModelDefinition = {
  id: 'headamame-v2',
  name: 'Head(amame) v2',
  selectorLabel: 'Head(amame) v2 — Head(amame)',
  designer: 'Head(amame)',
  ownershipNotice: 'Designed by Head(amame)',
  isCapraHeadphone: false,
  printFilesUrl: 'https://headamame.com/products/headamame-files',
  printFilesSource: 'Head(amame)',
  assetUrl: publicAsset('headamame-v2.glb'),
  previewUrl: publicAsset('headamame-v2-preview.png'),
  maskUrl: (partId) => publicAsset(`mask-headamame-v2-${partId.toLowerCase()}.png`),
  initialRotation: [0.08, 2.5916, 0],
  parts: headamameV2Parts,
  defaultColors: {
    S000: '#F96854', S001: '#F96854', S002: '#F96854', S003: '#F96854',
    S004: '#F6F6F3', S005: '#F96854', S006: '#F96854', S008: '#F96854',
    S010: '#F96854', S011: '#FDD835', S013: '#FFFFFF', S014: '#FFFFFF',
    S015: '#FDD835', S016: '#F96854', S017: '#F96854', S019: '#F96854',
    S021: '#F96854',
  },
  fixedColors: {
    S007: '#404040', S009: '#FFFFFF', S012: '#FFFFFF', S018: '#FFFFFF',
    S020: '#FFFFFF', S022: '#272727', S023: '#272727',
  },
  metallicSolids: [],
  fallbackFixedColor: '#343438',
}

// Keep unreleased models routable for private local review, but exclude them
// from PRODUCT_MODELS so they never appear in the public model selector.
const SHOW_183X_IN_MODEL_SELECTOR = false
export const PRODUCT_MODELS: ProductModelDefinition[] = [
  SATYR_4,
  OPEN_OMEGA,
  HEADAMAME_V2,
  ...(SHOW_183X_IN_MODEL_SELECTOR ? [MODEL_183X] : []),
]
const ROUTABLE_PRODUCT_MODELS = [...PRODUCT_MODELS, MODEL_183X]
export const PRODUCT_MODEL_BY_ID = Object.fromEntries(ROUTABLE_PRODUCT_MODELS.map((model) => [model.id, model])) as Record<string, ProductModelDefinition>
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
