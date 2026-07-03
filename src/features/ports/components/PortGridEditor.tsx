import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { PORT_EDITOR_BOX_MAX, portDotOverhang } from '../constants'
import { cellCount, clamp01, snapToGrid } from '../layout'
import type { PortPos } from '../types'

export interface EditablePort {
  side: 'inputs' | 'outputs'
  index: number
  pos: PortPos
}

interface PortGridEditorProps {
  /** Machine-face size in metres (width × height — the floor-plan elevation). */
  width: number
  height: number
  /** Grid size in metres per cell — drives the grid resolution. */
  gridSize: number
  /** Port dot diameter in pixels. */
  portScale: number
  /** Editor magnification (1 = the base 150 px box). */
  zoom: number
  ports: EditablePort[]
  onMove: (side: 'inputs' | 'outputs', index: number, pos: PortPos) => void
}

const EDGE = '#30363d'

const keyOf = (p: EditablePort) => `${p.side}-${p.index}`

/**
 * A grid sized to the machine face (cell size = floor grid). Each port shows as
 * a draggable dot; dropping snaps it to the nearest cell — any cell, including
 * the interior. Inputs are sky, outputs ficsit.
 */
export function PortGridEditor({
  width,
  height,
  gridSize,
  portScale,
  zoom,
  ports,
  onMove,
}: PortGridEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ key: string; fx: number; fy: number } | null>(
    null,
  )

  const cols = cellCount(width, gridSize)
  const rows = cellCount(height, gridSize)

  // Box drawn at the machine's aspect ratio; the long side is BOX_MAX × zoom.
  const long = Math.round(PORT_EDITOR_BOX_MAX * zoom)
  const aspect = width / height
  const boxW = aspect >= 1 ? long : Math.round(long * aspect)
  const boxH = aspect >= 1 ? Math.round(long / aspect) : long

  const fracFromEvent = (e: ReactPointerEvent): PortPos => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return { fx: 0, fy: 0 }
    return {
      fx: clamp01((e.clientX - r.left) / r.width),
      fy: clamp01((e.clientY - r.top) / r.height),
    }
  }

  // Edge/corner dots straddle the box outline; pad the scroll container by the
  // dot's overhang so they're never clipped.
  const pad = portDotOverhang(portScale)

  return (
    // Zoomed editors can outgrow their card — scroll within it, don't overlap.
    <div className="flex max-w-full flex-col gap-1 overflow-x-auto">
      <div style={{ padding: pad }} className="w-fit shrink-0">
        <div
          ref={ref}
          style={{ width: boxW, height: boxH }}
          className="relative touch-none rounded-sm border-2 border-sky-400/40 bg-surface-0"
        >
          {/* Gridlines as individual SVG lines: a repeating CSS background tile
              gets rounded to whole pixels, piling the error into one visibly
              wider column — per-line placement keeps the spacing even. */}
          <svg
            className="pointer-events-none absolute inset-0 size-full"
            aria-hidden
          >
            {Array.from({ length: cols - 1 }, (_, i) => {
              const x = `${((i + 1) * 100) / cols}%`
              return (
                <line key={`v${i}`} x1={x} y1="0" x2={x} y2="100%" stroke={EDGE} />
              )
            })}
            {Array.from({ length: rows - 1 }, (_, i) => {
              const y = `${((i + 1) * 100) / rows}%`
              return (
                <line key={`h${i}`} x1="0" y1={y} x2="100%" y2={y} stroke={EDGE} />
              )
            })}
          </svg>
          {ports.map((p) => {
            const k = keyOf(p)
            const live = drag?.key === k ? drag : p.pos
            const tone =
              p.side === 'inputs'
                ? 'bg-sky-400 ring-sky-200/60'
                : 'bg-ficsit ring-ficsit/60'
            return (
              <button
                key={k}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.currentTarget.setPointerCapture(e.pointerId)
                  setDrag({ key: k, fx: p.pos.fx, fy: p.pos.fy })
                }}
                onPointerMove={(e) => {
                  if (drag?.key !== k) return
                  setDrag({ key: k, ...fracFromEvent(e) })
                }}
                onPointerUp={(e) => {
                  if (drag?.key !== k) return
                  onMove(p.side, p.index, snapToGrid(drag.fx, drag.fy, cols, rows))
                  setDrag(null)
                  e.currentTarget.releasePointerCapture(e.pointerId)
                }}
                style={{
                  left: `${live.fx * 100}%`,
                  top: `${live.fy * 100}%`,
                  width: portScale,
                  height: portScale,
                }}
                title={`${p.side === 'inputs' ? 'In' : 'Out'} ${p.index + 1}`}
                aria-label={`${p.side} ${p.index + 1} position`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full ring-2 transition-transform hover:scale-125 active:cursor-grabbing ${tone}`}
              />
            )
          })}
        </div>
      </div>
      <span className="text-[10px] text-gray-500">
        Drag ports onto the grid ({cols}×{rows})
      </span>
    </div>
  )
}
