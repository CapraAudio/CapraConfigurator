import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  COLORS, DEFAULT_PRODUCT_MODEL, LEGACY_COLORS, LEGACY_GROUPS, PART_CATEGORIES,
  PRODUCT_MODEL_BY_ID, PRODUCT_MODELS, SATYR_4, normalizeHex,
  type PartCategory, type ProductConfigV2, type ProductModelDefinition,
} from './products'
import {
  FILAMENT_MATERIALS, amazonAffiliateUrl, buildFilamentCombinations,
  filamentColorsBrowseUrl, filamentColorsSwatchUrl, findFilamentRecommendations,
  type FilamentRecommendation,
} from './filaments'

type Theme = 'light' | 'dark'
type Colorway = Record<string, string>

function readTheme(): Theme {
  try {
    const saved = window.localStorage.getItem('capra-theme') ?? window.localStorage.getItem('satyr-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Storage can be unavailable in privacy-restricted contexts. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function decodeJson(value: string): unknown { return JSON.parse(atob(value)) }

function sanitizeColors(model: ProductModelDefinition, input: unknown) {
  const colors = { ...model.defaultColors }
  if (!input || typeof input !== 'object') return colors
  for (const part of model.parts) {
    const value = (input as Record<string, unknown>)[part.id]
    if (typeof value !== 'string') continue
    const normalized = normalizeHex(value)
    if (normalized) colors[part.id] = normalized
  }
  return colors
}

function readInitialConfig(): ProductConfigV2 {
  const params = new URLSearchParams(window.location.search)
  const encodedConfig = params.get('config')
  if (encodedConfig) {
    try {
      const parsed = decodeJson(encodedConfig) as Partial<ProductConfigV2>
      const model = typeof parsed.modelId === 'string' ? PRODUCT_MODEL_BY_ID[parsed.modelId] : undefined
      if (parsed.v === 2 && model) return { v: 2, modelId: model.id, colors: sanitizeColors(model, parsed.colors) }
    } catch { /* Fall through to legacy/default handling. */ }
  }

  const linkedModel = params.get('model')
  const requestedModel = linkedModel ? PRODUCT_MODEL_BY_ID[linkedModel] : undefined
  if (requestedModel) {
    return { v: 2, modelId: requestedModel.id, colors: { ...requestedModel.defaultColors } }
  }

  const encodedLegacy = params.get('colors')
  if (encodedLegacy) {
    const colors = { ...SATYR_4.defaultColors }
    try {
      const legacy = decodeJson(encodedLegacy) as Record<string, string>
      for (const [groupId, solidIds] of Object.entries(LEGACY_GROUPS)) {
        const value = legacy[groupId]
        const color = LEGACY_COLORS[value] ?? normalizeHex(value)
        if (!color) continue
        for (const solidId of solidIds) colors[solidId] = color.toUpperCase()
      }
      return { v: 2, modelId: SATYR_4.id, colors }
    } catch { /* Malformed legacy links safely use the site default. */ }
  }
  return { v: 2, modelId: DEFAULT_PRODUCT_MODEL.id, colors: { ...DEFAULT_PRODUCT_MODEL.defaultColors } }
}

function setModelParameter(url: URL, modelId: string) {
  url.searchParams.set('model', modelId)
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${source}`))
    image.src = source
  })
}

function ProductPreview({ definition, colorway, canvasRef }: {
  definition: ProductModelDefinition; colorway: Colorway; canvasRef: React.RefObject<HTMLCanvasElement>
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    let cancelled = false
    async function draw() {
      setStatus('loading')
      try {
        const [base, ...masks] = await Promise.all([
          loadImage(definition.previewUrl),
          ...definition.parts.map((part) => loadImage(definition.maskUrl(part.solidId))),
        ])
        if (cancelled || !canvasRef.current) return
        const canvas = canvasRef.current
        canvas.width = base.naturalWidth
        canvas.height = base.naturalHeight
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas is unavailable')
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(base, 0, 0)
        definition.parts.forEach((part, index) => {
          const layer = document.createElement('canvas')
          layer.width = canvas.width
          layer.height = canvas.height
          const layerContext = layer.getContext('2d')!
          layerContext.fillStyle = colorway[part.id] ?? definition.defaultColors[part.id]
          layerContext.fillRect(0, 0, layer.width, layer.height)
          layerContext.globalCompositeOperation = 'destination-in'
          layerContext.drawImage(masks[index], 0, 0)
          context.save()
          context.globalCompositeOperation = 'multiply'
          context.globalAlpha = 0.88
          context.drawImage(layer, 0, 0)
          context.restore()
        })
        setStatus('ready')
      } catch { if (!cancelled) setStatus('error') }
    }
    draw()
    return () => { cancelled = true }
  }, [canvasRef, colorway, definition])

  return <div className="preview-frame">
    <canvas ref={canvasRef} aria-label={`${definition.name} headphone colorway preview`} />
    {status === 'loading' && <div className="preview-status">Preparing model…</div>}
    {status === 'error' && <div className="preview-status error">The model preview could not load.</div>}
    <div className="preview-caption"><span>CAD color preview</span><span>Front three-quarter view</span></div>
  </div>
}

function solidForMesh(name: string) {
  const match = name.match(/solid_(\d+)/i)
  return match ? `S${match[1].padStart(3, '0')}` : undefined
}

function applyThreeColors(model: THREE.Object3D, definition: ProductModelDefinition, colorway: Colorway) {
  const customizable = new Set(definition.parts.map((part) => part.solidId))
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const solid = solidForMesh(object.name)
    if (!solid) return
    const color = customizable.has(solid)
      ? colorway[solid] ?? definition.defaultColors[solid]
      : definition.fixedColors[solid] ?? definition.fallbackFixedColor
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
      if (material instanceof THREE.ShaderMaterial && material.uniforms.baseColor) material.uniforms.baseColor.value.set(color)
    })
  })
}

function createCadMaterial(color: string, metallic: boolean) {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Color(color) },
      metallic: { value: metallic ? 1 : 0 },
      selectionGlow: { value: 0 },
    },
    vertexShader: `
      varying vec3 vViewPosition;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = viewPosition.xyz;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 baseColor;
      uniform float metallic;
      uniform float selectionGlow;
      varying vec3 vViewPosition;
      void main() {
        vec3 dx = dFdx(vViewPosition);
        vec3 dy = dFdy(vViewPosition);
        vec3 normal = normalize(cross(dx, dy));
        vec3 lightDirection = normalize(vec3(0.45, 0.72, 0.8));
        float diffuse = 0.58 + 0.42 * abs(dot(normal, lightDirection));
        vec3 viewDirection = normalize(-vViewPosition);
        float rim = pow(1.0 - abs(dot(normal, viewDirection)), 2.2) * 0.16;
        float highlight = pow(abs(dot(reflect(-lightDirection, normal), viewDirection)), 18.0) * (0.08 + metallic * 0.22);
        vec3 glowColor = mix(baseColor, vec3(1.0), 0.42);
        vec3 selectionLight = glowColor * selectionGlow * (0.28 + rim * 1.2);
        vec3 shaded = baseColor * diffuse + baseColor * rim + vec3(highlight) + selectionLight;
        gl_FragColor = vec4(shaded, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
  })
}

function createSelectionOverlayMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color('#FFF1D8') },
      glowStrength: { value: 0 },
    },
    vertexShader: `
      varying vec3 vViewPosition;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = viewPosition.xyz;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float glowStrength;
      varying vec3 vViewPosition;
      void main() {
        vec3 dx = dFdx(vViewPosition);
        vec3 dy = dFdy(vViewPosition);
        vec3 normal = normalize(cross(dx, dy));
        vec3 viewDirection = normalize(-vViewPosition);
        float rim = pow(1.0 - abs(dot(normal, viewDirection)), 1.65);
        float alpha = glowStrength * (0.055 + rim * 0.32);
        gl_FragColor = vec4(glowColor * (0.38 + rim * 1.1), alpha);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.geometry.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => material.dispose())
  })
}

function doublePulse(elapsedMilliseconds: number) {
  const elapsed = elapsedMilliseconds / 1000
  if (elapsed >= 0 && elapsed <= 0.44) return Math.sin(Math.PI * elapsed / 0.44)
  if (elapsed >= 0.54 && elapsed <= 0.98) return Math.sin(Math.PI * (elapsed - 0.54) / 0.44)
  return 0
}

function ThreePreview({ definition, colorway, canvasRef, theme, selectedSolidId, selectionPulseKey }: {
  definition: ProductModelDefinition
  colorway: Colorway
  canvasRef: React.RefObject<HTMLCanvasElement>
  theme: Theme
  selectedSolidId: string
  selectionPulseKey: number
}) {
  const [mode, setMode] = useState<'loading' | 'three' | 'fallback'>('loading')
  const modelRef = useRef<THREE.Object3D | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const latestTheme = useRef(theme)
  const latestColorway = useRef(colorway)
  const latestSelectedSolid = useRef(selectedSolidId)
  const selectionPulse = useRef({ solidId: selectedSolidId, startedAt: performance.now() })
  const reduceMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  latestTheme.current = theme
  latestColorway.current = colorway
  latestSelectedSolid.current = selectedSolidId

  useEffect(() => {
    selectionPulse.current = { solidId: selectedSolidId, startedAt: performance.now() }
  }, [selectedSolidId, selectionPulseKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frame = 0
    let disposed = false
    let renderer: THREE.WebGLRenderer | undefined
    let controls: OrbitControls | undefined
    let observer: ResizeObserver | undefined
    let holder: THREE.Group | undefined
    const selectionOverlays: Array<{ solid: string; material: THREE.ShaderMaterial }> = []
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(latestTheme.current === 'dark' ? '#181816' : '#E8E4DC')
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000)
    camera.position.set(0, 0, 10)
    setMode('loading')

    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
    } catch { setMode('fallback'); return }

    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.enablePan = false

    function fitCamera() {
      if (!holder || !controls) return
      const bounds = new THREE.Box3().setFromObject(holder)
      const center = bounds.getCenter(new THREE.Vector3())
      const size = bounds.getSize(new THREE.Vector3())
      const verticalFov = THREE.MathUtils.degToRad(camera.fov)
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect)
      const heightDistance = size.y / (2 * Math.tan(verticalFov / 2))
      const widthDistance = size.x / (2 * Math.tan(horizontalFov / 2))
      const distance = (Math.max(heightDistance, widthDistance) + size.z / 2) * 1.18
      camera.near = Math.max(distance / 100, 0.01)
      camera.far = distance * 100
      camera.position.set(center.x, center.y, center.z + distance)
      camera.updateProjectionMatrix()
      controls.target.copy(center)
      controls.minDistance = distance * 0.55
      controls.maxDistance = distance * 3
      controls.update()
    }

    new GLTFLoader().load(definition.assetUrl, (gltf) => {
      if (disposed) { disposeObject(gltf.scene); return }
      const model = gltf.scene
      const customizable = new Set(definition.parts.map((part) => part.solidId))
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        const solid = solidForMesh(object.name)
        if (!solid) return
        const color = customizable.has(solid)
          ? latestColorway.current[solid] ?? definition.defaultColors[solid]
          : definition.fixedColors[solid] ?? definition.fallbackFixedColor
        object.material = createCadMaterial(color, definition.metallicSolids.includes(solid))
      })
      const originalMeshes: Array<{ mesh: THREE.Mesh; solid: string }> = []
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        const solid = solidForMesh(object.name)
        if (solid && customizable.has(solid)) originalMeshes.push({ mesh: object, solid })
      })
      originalMeshes.forEach(({ mesh, solid }) => {
        const material = createSelectionOverlayMaterial()
        const overlay = new THREE.Mesh(mesh.geometry, material)
        overlay.name = `selection-overlay-${solid}`
        overlay.renderOrder = 1000
        mesh.add(overlay)
        selectionOverlays.push({ solid, material })
      })
      modelRef.current = model
      applyThreeColors(model, definition, latestColorway.current)
      selectionPulse.current = { solidId: latestSelectedSolid.current, startedAt: performance.now() }
      const originalBounds = new THREE.Box3().setFromObject(model)
      model.position.sub(originalBounds.getCenter(new THREE.Vector3()))
      holder = new THREE.Group()
      holder.rotation.set(...definition.initialRotation)
      holder.add(model)
      scene.add(holder)
      fitCamera()
      setMode('three')
    }, undefined, () => { if (!disposed) setMode('fallback') })

    function resize() {
      if (!renderer) return
      const width = canvas!.clientWidth || 800
      const height = canvas!.clientHeight || 600
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      fitCamera()
    }
    observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    function animate() {
      if (disposed || !renderer) return
      const elapsed = performance.now() - selectionPulse.current.startedAt
      const glow = reduceMotion.current ? (elapsed < 700 ? 0.62 : 0) : doublePulse(elapsed)
      modelRef.current?.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        const solid = solidForMesh(object.name)
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => {
          if (material instanceof THREE.ShaderMaterial && material.uniforms.selectionGlow) {
            material.uniforms.selectionGlow.value = solid === selectionPulse.current.solidId ? glow : 0
          }
        })
      })
      selectionOverlays.forEach(({ solid, material }) => {
        material.uniforms.glowStrength.value = solid === selectionPulse.current.solidId ? glow : 0
      })
      controls?.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer?.disconnect()
      controls?.dispose()
      disposeObject(scene)
      renderer?.dispose()
      modelRef.current = null
      sceneRef.current = null
    }
  }, [canvasRef, definition])

  useEffect(() => { if (modelRef.current) applyThreeColors(modelRef.current, definition, colorway) }, [colorway, definition])
  useEffect(() => {
    if (sceneRef.current) sceneRef.current.background = new THREE.Color(theme === 'dark' ? '#181816' : '#E8E4DC')
  }, [theme])

  if (mode === 'fallback') return <ProductPreview definition={definition} colorway={colorway} canvasRef={canvasRef} />
  return <div className="preview-frame three-preview">
    <canvas ref={canvasRef} aria-label={`Interactive 3D ${definition.name} headphone model`} />
    {mode === 'loading' && <div className="preview-status">Loading 3D model…</div>}
    <div className="preview-caption"><span>Drag to rotate · Scroll to zoom</span><span>Interactive 3D</span></div>
  </div>
}

function FilamentFinderDialog({ open, definition, colorway, onClose }: {
  open: boolean
  definition: ProductModelDefinition
  colorway: Colorway
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [recommendations, setRecommendations] = useState<FilamentRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [requestId, setRequestId] = useState(0)
  const combinations = useMemo(() => buildFilamentCombinations(definition, colorway), [colorway, definition])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    let current = true
    setLoading(true)
    setRecommendations([])
    findFilamentRecommendations(combinations).then((results) => {
      if (current) setRecommendations(results)
    }).finally(() => {
      if (current) setLoading(false)
    })
    return () => { current = false }
  }, [combinations, open, requestId])

  const grouped = useMemo(() => {
    const groups = new Map<string, FilamentRecommendation[]>()
    for (const recommendation of recommendations) {
      const group = groups.get(recommendation.color)
      if (group) group.push(recommendation)
      else groups.set(recommendation.color, [recommendation])
    }
    return [...groups.entries()]
  }, [recommendations])
  const failedCount = recommendations.filter((item) => item.status === 'error').length

  return <dialog
    ref={dialogRef}
    className="filament-dialog"
    aria-labelledby="filament-dialog-title"
    aria-describedby="filament-dialog-intro"
    onClose={onClose}
    onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dialogRef.current?.close()
      }
    }}
    onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close() }}
  >
    <div className="filament-dialog-panel">
      <header className="filament-dialog-header">
        <div>
          <p className="eyebrow">MATERIAL MATCHING</p>
          <h2 id="filament-dialog-title">Find Filaments</h2>
          <p id="filament-dialog-intro">Closest measured colors for every material approved for this colorway.</p>
        </div>
        <button className="dialog-close" type="button" autoFocus aria-label="Close filament finder" onClick={() => dialogRef.current?.close()}>×</button>
      </header>

      {loading && <div className="filament-loading" role="status">
        <span className="loading-dot" aria-hidden="true" /> Matching colors with FilamentColors.xyz…
      </div>}

      {!loading && combinations.length === 0 && <div className="filament-empty">
        <h3>No configurable colors found.</h3><p>Close this window and select a model color before trying again.</p>
      </div>}

      {!loading && failedCount > 0 && <div className="filament-notice" role="status">
        <span>{failedCount === recommendations.length ? 'Filament matching is currently unavailable.' : `${failedCount} material ${failedCount === 1 ? 'match' : 'matches'} could not be loaded.`}</span>
        <button type="button" onClick={() => setRequestId((value) => value + 1)}>Retry</button>
      </div>}

      {!loading && <div className="filament-groups">
        {grouped.map(([color, items]) => <section className="filament-color-group" key={color}>
          <h3><i style={{ background: color }} aria-hidden="true" /><span>{color}</span><small>{items.length} approved {items.length === 1 ? 'material' : 'materials'}</small></h3>
          <div className="filament-table-wrap">
            <table>
              <thead><tr><th>Material</th><th>Closest filament</th><th>Color</th><th>Used on</th><th>Links</th></tr></thead>
              <tbody>{items.map((item) => {
                const material = FILAMENT_MATERIALS[item.material]
                return <tr key={`${item.color}:${item.material}`} className={item.status === 'error' ? 'match-error' : ''}>
                  <td data-label="Material"><strong>{material.label}</strong></td>
                  <td data-label="Closest filament">{item.swatch
                    ? <><strong>{item.swatch.manufacturer} · {item.swatch.colorName}</strong><small>{item.swatch.filamentType}</small></>
                    : <><strong>Match unavailable</strong><small>{item.error}</small></>}</td>
                  <td data-label="Color"><div className="color-comparison"><span style={{ background: item.color }} /><code>{item.color}</code>{item.swatch && <><b>→</b><span style={{ background: item.swatch.hex }} /><code>{item.swatch.hex}</code></>}</div></td>
                  <td data-label="Used on"><span className="part-list">{item.parts.map((part) => part.name).join(', ')}</span></td>
                  <td data-label="Links"><div className="filament-links">{item.swatch ? <>
                    <a href={filamentColorsSwatchUrl(item.swatch)} target="_blank" rel="noopener noreferrer">View swatch</a>
                    {item.swatch.manufacturerPurchaseUrl && <a href={item.swatch.manufacturerPurchaseUrl} target="_blank" rel="noopener noreferrer sponsored">Manufacturer</a>}
                    <a className="amazon-link" href={amazonAffiliateUrl(item.swatch)} target="_blank" rel="noopener noreferrer sponsored">Search Amazon <small>(paid link)</small></a>
                  </> : <a href={filamentColorsBrowseUrl(item.material)} target="_blank" rel="noopener noreferrer">Browse {material.label}</a>}</div></td>
                </tr>
              })}</tbody>
            </table>
          </div>
        </section>)}
      </div>}

      <footer className="filament-dialog-footer">
        <p>Measured color data provided by <a href="https://filamentcolors.xyz/" target="_blank" rel="noopener noreferrer">FilamentColors.xyz</a>. Computer previews and physical filament may differ.</p>
        <p className="affiliate-disclosure">As an Amazon Associate I earn from qualifying purchases.</p>
      </footer>
    </div>
  </dialog>
}

export default function App() {
  const [initialConfig] = useState(readInitialConfig)
  const [modelId, setModelId] = useState(initialConfig.modelId)
  const model = PRODUCT_MODEL_BY_ID[modelId] ?? DEFAULT_PRODUCT_MODEL
  const [colorway, setColorway] = useState<Colorway>(initialConfig.colors)
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [category, setCategory] = useState<PartCategory>('headband')
  const [selectedPart, setSelectedPart] = useState(model.parts[0].id)
  const [hexDraft, setHexDraft] = useState(colorway[model.parts[0].id])
  const [copied, setCopied] = useState(false)
  const [filamentFinderOpen, setFilamentFinderOpen] = useState(false)
  const [selectionPulseKey, setSelectionPulseKey] = useState(0)
  const filamentButtonRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visibleParts = useMemo(() => model.parts.filter((part) => part.category === category), [category, model])
  const currentPart = model.parts.find((part) => part.id === selectedPart) ?? visibleParts[0] ?? model.parts[0]
  const currentColor = colorway[currentPart.id] ?? model.defaultColors[currentPart.id]
  const invalidHex = hexDraft.length > 0 && !normalizeHex(hexDraft)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { window.localStorage.setItem('capra-theme', theme) } catch { /* Theme still works for this visit. */ }
  }, [theme])
  useEffect(() => { setHexDraft(currentColor) }, [currentColor, currentPart.id])
  useEffect(() => {
    function restoreUrlState() {
      const config = readInitialConfig()
      const restoredModel = PRODUCT_MODEL_BY_ID[config.modelId] ?? DEFAULT_PRODUCT_MODEL
      setModelId(restoredModel.id)
      setColorway(config.colors)
      setCategory('headband')
      setSelectedPart(restoredModel.parts[0].id)
    }
    window.addEventListener('popstate', restoreUrlState)
    return () => window.removeEventListener('popstate', restoreUrlState)
  }, [])

  function chooseColor(value: string) {
    const color = normalizeHex(value)
    if (color) setColorway((previous) => ({ ...previous, [currentPart.id]: color }))
  }
  function chooseCategory(nextCategory: PartCategory) {
    setCategory(nextCategory)
    const firstPart = model.parts.find((part) => part.category === nextCategory)
    if (firstPart) {
      setSelectedPart(firstPart.id)
      setSelectionPulseKey((value) => value + 1)
    }
  }
  function choosePart(partId: string) {
    setSelectedPart(partId)
    setSelectionPulseKey((value) => value + 1)
  }
  function chooseModel(nextModelId: string) {
    const nextModel = PRODUCT_MODEL_BY_ID[nextModelId]
    if (!nextModel) return
    setModelId(nextModel.id)
    setColorway({ ...nextModel.defaultColors })
    setCategory('headband')
    setSelectedPart(nextModel.parts[0].id)
    setSelectionPulseKey((value) => value + 1)
    const url = new URL(window.location.href)
    url.searchParams.delete('config')
    url.searchParams.delete('colors')
    setModelParameter(url, nextModel.id)
    window.history.pushState({}, '', url)
  }
  function reset() {
    setColorway({ ...model.defaultColors })
    const url = new URL(window.location.href)
    url.searchParams.delete('config')
    url.searchParams.delete('colors')
    setModelParameter(url, model.id)
    window.history.replaceState({}, '', url)
  }
  async function share() {
    const config: ProductConfigV2 = { v: 2, modelId: model.id, colors: colorway }
    const url = new URL(window.location.href)
    url.searchParams.delete('colors')
    setModelParameter(url, model.id)
    url.searchParams.set('config', btoa(JSON.stringify(config)))
    window.history.replaceState({}, '', url)
    try {
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch { window.prompt('Copy your colorway link', url.toString()) }
  }
  async function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height
    const context = exportCanvas.getContext('2d')
    if (!context) return
    context.drawImage(canvas, 0, 0)

    try {
      const watermark = await loadImage('./capra-watermark.svg')
      const watermarkWidth = Math.round(exportCanvas.width * 0.12)
      const aspectRatio = watermark.naturalWidth / watermark.naturalHeight || 494 / 412
      const watermarkHeight = Math.round(watermarkWidth / aspectRatio)
      const inset = Math.round(exportCanvas.width * 0.025)
      const tintedWatermark = document.createElement('canvas')
      tintedWatermark.width = watermarkWidth
      tintedWatermark.height = watermarkHeight
      const watermarkContext = tintedWatermark.getContext('2d')
      if (watermarkContext) {
        watermarkContext.drawImage(watermark, 0, 0, watermarkWidth, watermarkHeight)
        watermarkContext.globalCompositeOperation = 'source-in'
        watermarkContext.fillStyle = theme === 'dark' ? '#FFFFFF' : '#171719'
        watermarkContext.fillRect(0, 0, watermarkWidth, watermarkHeight)
        context.save()
        context.globalAlpha = 0.62
        context.drawImage(
          tintedWatermark,
          exportCanvas.width - watermarkWidth - inset,
          exportCanvas.height - watermarkHeight - inset,
        )
        context.restore()
      }
    } catch { /* Export the model without a watermark if the logo asset cannot load. */ }

    const exportCredit = `${model.name.toUpperCase()} · ${model.ownershipNotice.toUpperCase()}`
    const creditSize = Math.max(12, Math.round(exportCanvas.width * 0.014))
    const creditInset = Math.round(exportCanvas.width * 0.025)
    context.save()
    context.font = `700 ${creditSize}px Montserrat, sans-serif`
    context.textBaseline = 'bottom'
    context.fillStyle = theme === 'dark' ? 'rgba(255,255,255,.78)' : 'rgba(23,23,25,.72)'
    context.fillText(exportCredit, creditInset, exportCanvas.height - creditInset)
    context.restore()

    const link = document.createElement('a')
    link.download = `${model.id}-colorway.png`
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
  }

  return <main className="site-shell">
    <header className="topbar">
      <a className="wordmark" href="https://capraaudio.com/" aria-label="Visit Capra Audio website"><span className="wordmark-logo" aria-hidden="true"><img src="./capra-watermark.svg" alt="" /></span><span>CAPRA</span></a>
      <span className="section-label">Configurator</span>
      <div className="topbar-actions">
        <label className="model-selector"><span>Model</span><select value={model.id} onChange={(event) => chooseModel(event.target.value)} aria-label="Headphone model">
          {PRODUCT_MODELS.map((item) => <option key={item.id} value={item.id}>{item.selectorLabel}</option>)}
        </select></label>
        <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '◐'}</span>{theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </header>

    <section className="hero compact-hero">
      <div><h1>Capra Configurator</h1><p className="intro">Select a model, choose an individual component, and build your colorway on the production CAD assembly.</p></div>
    </section>

    <section className="configurator">
      <div className="product-area">
        <ThreePreview definition={model} colorway={colorway} canvasRef={canvasRef} theme={theme} selectedSolidId={currentPart.solidId} selectionPulseKey={selectionPulseKey} />
        <div className="preview-footer"><div><span>Current model</span><strong>{model.name} · {model.parts.length} customizable parts</strong><small className={model.isCapraHeadphone ? 'model-credit' : 'model-credit external-design'}>{model.ownershipNotice}</small></div><div className="preview-actions"><a href={model.printFilesUrl} target="_blank" rel="noopener noreferrer">Get print files <small>{model.printFilesSource}</small></a><button onClick={download}>Download PNG</button></div></div>
      </div>

      <aside className="controls">
        <div className="controls-heading"><div><p className="eyebrow">CUSTOMIZE</p><h2>Pick a part.</h2></div><button className="reset-button" onClick={reset}>Reset</button></div>
        <div className="category-tabs" role="tablist" aria-label="Part categories">
          {PART_CATEGORIES.map((item) => <button key={item.id} id={`category-${item.id}`} type="button" role="tab" aria-selected={category === item.id} aria-controls="category-parts" className={category === item.id ? 'active' : ''} onClick={() => chooseCategory(item.id)}>{item.name}</button>)}
        </div>
        <div className="part-grid" id="category-parts" role="tabpanel" aria-labelledby={`category-${category}`}>
          {visibleParts.map((part) => <button key={part.id} type="button" aria-pressed={selectedPart === part.id} className={selectedPart === part.id ? 'active' : ''} onClick={() => choosePart(part.id)}>
            <i style={{ background: colorway[part.id] }} /><span>{part.name}</span>{(part.displayCode || !part.hideSolidId) && <small>{part.displayCode ?? part.solidId}</small>}
          </button>)}
        </div>

        <div className="color-section">
          <div className="color-heading"><div><span>{currentPart.name}</span>{(currentPart.displayCode || !currentPart.hideSolidId) && <small>{currentPart.displayCode ? `${currentPart.displayCode}${currentPart.hideSolidId ? '' : ` · ${currentPart.solidId}`}` : currentPart.solidId}</small>}</div><code>{currentColor}</code></div>
          <div className="palette">
            {COLORS.map((color) => {
              const selected = currentColor.toUpperCase() === color.hex
              return <button key={color.id} type="button" className={selected ? 'selected' : ''} onClick={() => chooseColor(color.hex)} aria-label={`Set ${currentPart.name} to ${color.name}`} aria-pressed={selected}>
                <i style={{ background: color.hex, color: color.id === 'yellow' ? '#201F1B' : '#FFFFFF' }}>{selected ? '✓' : ''}</i><span>{color.name}</span>
              </button>
            })}
          </div>
          <div className="custom-color">
            <label className="color-picker"><span>Color selector</span><input type="color" value={currentColor} onChange={(event) => { setHexDraft(event.target.value.toUpperCase()); chooseColor(event.target.value) }} /></label>
            <label className="hex-input"><span>Hex code</span><input type="text" value={hexDraft} aria-invalid={invalidHex} aria-describedby="hex-help" spellCheck={false} maxLength={7} onChange={(event) => { const value = event.target.value; setHexDraft(value); const normalized = normalizeHex(value); if (normalized) chooseColor(normalized) }} /></label>
          </div>
          <p id="hex-help" className={invalidHex ? 'hex-help error' : 'hex-help'} aria-live="polite">{invalidHex ? 'Enter a 3- or 6-digit hex color.' : 'Use RGB or RRGGBB, with or without #.'}</p>
        </div>
        <button ref={filamentButtonRef} className="filament-button" onClick={() => setFilamentFinderOpen(true)}>Find Filaments</button>
        <button className="share-button" onClick={share}>{copied ? 'Link copied ✓' : 'Share this colorway'}</button>
      </aside>
    </section>
    <footer><span>Capra Configurator</span><span>{model.name} · {model.ownershipNotice}</span><span>As an Amazon Associate I earn from qualifying purchases.</span></footer>
    <FilamentFinderDialog
      open={filamentFinderOpen}
      definition={model}
      colorway={colorway}
      onClose={() => { setFilamentFinderOpen(false); window.setTimeout(() => filamentButtonRef.current?.focus(), 0) }}
    />
  </main>
}
