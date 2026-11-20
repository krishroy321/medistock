import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace, Vector3 } from 'three'
import { ChevronLeft, ChevronRight, Focus, PackageOpen } from 'lucide-react'
import { MedicineObject } from './MedicineObject.jsx'
import { MedicineShelf } from './MedicineShelf.jsx'
import { SceneFallback } from './SceneFallback.jsx'
import { getStatus, STATUS_META } from '../../lib/inventory.js'
import { useReducedMotion } from '../../hooks/useMotion.js'

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

class SceneErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function getShelfOrder(medicines) {
  const active = medicines.filter((medicine) => !medicine.quarantined)
  const forms = new Set()
  const representatives = active.filter((medicine) => {
    const form = medicine.form?.toLowerCase() || 'other'
    if (forms.has(form)) return false
    forms.add(form)
    return true
  })
  const representativeIds = new Set(representatives.map((medicine) => medicine.id))
  return [...representatives, ...active.filter((medicine) => !representativeIds.has(medicine.id))]
}

function getShelfPositions(visible, columns) {
  return visible.map((_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const rowCount = Math.min(columns, visible.length - row * columns)
    const spacing = columns === 2 ? 2.25 : 1.72
    return [((column - (rowCount - 1) / 2) * spacing), [2.17, 0.77, -0.63][row], 0]
  })
}

function ShelfContents({ medicines, page, pageSize, columns, selectedId, onSelect, onHover, controlsRef, reducedMotion }) {
  const { camera, invalidate } = useThree()
  const controls = useRef(null)
  const focus = useRef(null)
  const ordered = useMemo(() => getShelfOrder(medicines), [medicines])
  const visible = ordered.slice(page * pageSize, (page + 1) * pageSize)

  useEffect(() => {
    controlsRef.current = {
      focus(position) {
        focus.current = {
          target: new Vector3(position[0], position[1], 0),
          camera: new Vector3(position[0], position[1] + 1.8, 7.4),
        }
      },
    }
    return () => { controlsRef.current = null }
  }, [controlsRef])

  useFrame((_, delta) => {
    if (!focus.current || !controls.current) return
    const factor = Math.min(1, delta * 4)
    controls.current.target.lerp(focus.current.target, factor)
    camera.position.lerp(focus.current.camera, factor)
    controls.current.update()
    if (camera.position.distanceTo(focus.current.camera) < 0.04) focus.current = null
    else invalidate()
  })

  const positions = getShelfPositions(visible, columns)

  return (
    <>
      <color attach="background" args={['#e3ebe6']} />
      <hemisphereLight args={['#f5fbf7', '#84968d', 0.72]} />
      <ambientLight intensity={0.36} />
      <directionalLight position={[4, 7, 5]} intensity={1.45} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-5, 3, 1]} intensity={0.48} color="#d7f0e5" />
      <MedicineShelf>
        {visible.map((medicine, index) => (
          <MedicineObject
            key={medicine.id}
            medicine={medicine}
            position={positions[index]}
            selected={selectedId === medicine.id}
            onSelect={(item) => onSelect(item, positions[index])}
            onHover={onHover}
            reducedMotion={reducedMotion}
            labelWidth={columns === 1 ? 2.35 : columns === 2 ? 2 : 1.65}
          />
        ))}
      </MedicineShelf>
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        minDistance={6.4}
        maxDistance={10}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.08}
        target={[0, 0.4, 0]}
      />
    </>
  )
}

export function PharmacyScene({
  medicines = [],
  onSelect,
  mode = 'hero',
  targetMedicineId = null,
  emptyTitle = 'No active medicine batches',
  emptyDescription = 'Add inventory to see your pharmacy shelf.',
}) {
  const reducedMotion = useReducedMotion()
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [page, setPage] = useState(0)
  const controlsRef = useRef(null)
  const sceneRef = useRef(null)
  const [ignoredTargetId, setIgnoredTargetId] = useState(null)
  const [webglAvailable, setWebglAvailable] = useState(null)
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 479px)').matches)
  const [tablet, setTablet] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 480px) and (max-width: 899px)').matches)
  const ordered = useMemo(() => getShelfOrder(medicines), [medicines])
  const columns = mobile ? 1 : tablet ? 2 : 3
  const pageSize = columns * 3
  const totalPages = Math.max(1, Math.ceil(ordered.length / pageSize))
  const targetIndex = targetMedicineId ? ordered.findIndex((medicine) => medicine.id === targetMedicineId) : -1
  const targetIsActive = targetIndex >= 0 && ignoredTargetId !== targetMedicineId
  const targetPage = targetIsActive ? Math.floor(targetIndex / pageSize) : null
  const currentPage = targetPage ?? Math.min(page, totalPages - 1)
  const selectedMedicine = medicines.find((medicine) => medicine.id === (selected?.id || (targetIsActive ? targetMedicineId : null)))
  const hoveredMedicine = medicines.find((medicine) => medicine.id === hovered?.id)
  const highlighted = selectedMedicine || hoveredMedicine
  const status = highlighted ? getStatus(highlighted) : null
  const statusMeta = status ? STATUS_META[status] : null
  const visible = ordered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  const positions = getShelfPositions(visible, columns)

  useEffect(() => {
    const mobileMedia = window.matchMedia('(max-width: 479px)')
    const tabletMedia = window.matchMedia('(min-width: 480px) and (max-width: 899px)')
    const update = () => {
      setMobile(mobileMedia.matches)
      setTablet(tabletMedia.matches)
    }
    mobileMedia.addEventListener('change', update)
    tabletMedia.addEventListener('change', update)
    return () => {
      mobileMedia.removeEventListener('change', update)
      tabletMedia.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setWebglAvailable(canUseWebGL()))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const canvas = sceneRef.current?.querySelector('canvas')
    if (canvas) canvas.style.cursor = hovered ? 'pointer' : 'grab'
  }, [hovered])

  useEffect(() => {
    if (targetIndex < 0) return
    const targetPage = Math.floor(targetIndex / pageSize)
    const pageMedicines = ordered.slice(targetPage * pageSize, (targetPage + 1) * pageSize)
    const targetPosition = getShelfPositions(pageMedicines, columns)[targetIndex - targetPage * pageSize]
    controlsRef.current?.focus(targetPosition)
  }, [targetIndex, ordered, pageSize, columns])

  const selectMedicine = (medicine, position) => {
    setSelected(medicine)
    setHovered(null)
    if (position) controlsRef.current?.focus(position)
  }

  return (
    <section aria-label="Interactive pharmacy inventory shelf" className="w-full">
      <div ref={sceneRef} className={`relative isolate overflow-hidden rounded-[2rem] border border-line bg-[#e3ebe6] ${mode === 'hero' ? 'h-[500px] min-h-[430px]' : mode === 'dashboard' ? 'h-[390px] min-h-[350px]' : 'h-[470px] min-h-[410px]'}`}>
        {ordered.length ? (
          webglAvailable === null ? (
            <div className="grid h-full place-items-center text-sm text-muted" role="status">Preparing pharmacy shelf…</div>
          ) : webglAvailable ? (
            <SceneErrorBoundary fallback={<SceneFallback medicines={ordered} onSelect={(medicine) => selectMedicine(medicine)} />}>
              <Canvas
                frameloop="demand"
                shadows
                dpr={[1, 1.25]}
                camera={{ position: [0, 2.3, 8.1], fov: 40 }}
                gl={{ antialias: true, powerPreference: 'low-power' }}
                onCreated={({ gl }) => {
                  gl.shadowMap.type = PCFShadowMap
                  gl.toneMapping = ACESFilmicToneMapping
                  gl.outputColorSpace = SRGBColorSpace
                }}
                fallback={<SceneFallback medicines={ordered} onSelect={(medicine) => selectMedicine(medicine)} />}
              >
                <Suspense fallback={null}>
                  <ShelfContents
                    medicines={ordered}
                    page={currentPage}
                    pageSize={pageSize}
                    columns={columns}
                    selectedId={selectedMedicine?.id}
                    onSelect={selectMedicine}
                    onHover={setHovered}
                    controlsRef={controlsRef}
                    reducedMotion={reducedMotion}
                  />
                </Suspense>
              </Canvas>
            </SceneErrorBoundary>
          ) : (
            <SceneFallback medicines={ordered} onSelect={(medicine) => selectMedicine(medicine)} />
          )
        ) : (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <PackageOpen className="mx-auto text-subtle" size={36} />
              <p className="mt-3 font-semibold">{emptyTitle}</p>
              <p className="mt-1 text-sm text-muted">{emptyDescription}</p>
            </div>
          </div>
        )}

        {highlighted && statusMeta && (
          <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-24px)] items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-card sm:left-5 sm:top-5 sm:max-w-sm">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: statusMeta.color }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#17211e]">{highlighted.name}</p>
              <p className="text-xs text-[#56625e]">{highlighted.quantity} units · {statusMeta.label}</p>
            </div>
            {selectedMedicine && onSelect && (
              <button
                type="button"
                onClick={() => onSelect(selectedMedicine)}
                className="shrink-0 rounded-lg bg-brand-700 px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                Open record
              </button>
            )}
          </div>
        )}

        <select
          aria-label="Select a medicine batch to focus"
          value=""
          onChange={(event) => {
            const index = visible.findIndex((medicine) => medicine.id === event.target.value)
            if (index >= 0) selectMedicine(visible[index], positions[index])
          }}
          className="sr-only focus:not-sr-only focus:absolute focus:bottom-14 focus:left-3 focus:z-20 focus:w-[calc(100%-24px)] focus:rounded-xl focus:border focus:border-[#d3ddd7] focus:bg-white focus:p-3 focus:text-[#17211e] focus:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          <option value="" disabled>Select a package</option>
          {visible.map((medicine) => (
            <option key={medicine.id} value={medicine.id}>
              {medicine.name} · {medicine.quantity} units
            </option>
          ))}
        </select>

      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Focus size={13} className="text-brand-700" />
          {`Showing ${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, ordered.length)} of ${ordered.length} active batches · select a package to focus`}
        </span>
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          {['healthy', 'low', 'expiring', 'expired', 'out'].map((key) => (
            <span key={key} className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_META[key].color }} />
              {STATUS_META[key].label}
            </span>
          ))}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface p-1 shadow-card">
            <button type="button" aria-label="Previous shelf page" disabled={currentPage === 0} onClick={() => { setIgnoredTargetId(targetMedicineId); setSelected(null); setPage(Math.max(0, currentPage - 1)) }} className="grid h-8 w-8 place-items-center rounded-full text-[#34423c] transition hover:bg-[#e8efeb] disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft size={15} />
            </button>
            <span className="min-w-16 text-center text-xs font-semibold text-[#34423c]">{currentPage + 1} / {totalPages}</span>
            <button type="button" aria-label="Next shelf page" disabled={currentPage >= totalPages - 1} onClick={() => { setIgnoredTargetId(targetMedicineId); setSelected(null); setPage(Math.min(totalPages - 1, currentPage + 1)) }} className="grid h-8 w-8 place-items-center rounded-full text-[#34423c] transition hover:bg-[#e8efeb] disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
