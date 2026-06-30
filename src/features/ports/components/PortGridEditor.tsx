import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

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
  /** Floor-plan grid size (metres per cell) — drives the grid resolution. */
  gridSize: number
  ports: EditablePort[]
  onMove: (side: 'inputs' | 'outputs', index: number, pos: PortPos) => void
}

const BOX_MAX = 150
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
  ports,
  onMove,
}: PortGridEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ key: string; fx: number; fy: number } | null>(
    null,
  )

  const cols = cellCount(width, gridSize)
  const rows = cellCount(height, gridSize)

  // Box drawn at the machine's aspect ratio, capped at BOX_MAX on the long side.
  const aspect = width / height
  const boxW = aspect >= 1 ? BOX_MAX : Math.round(BOX_MAX * aspect)
  const boxH = aspect >= 1 ? Math.round(BOX_MAX / aspect) : BOX_MAX

  const fracFromEvent = (e: ReactPointerEvent): PortPos => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return { fx: 0, fy: 0 }
    return {
      fx: clamp01((e.clientX - r.left) / r.width),
      fy: clamp01((e.clientY - r.top) / r.height),
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={ref}
        style={{
          width: boxW,
          height: boxH,
          backgroundImage: `linear-gradient(to right, ${EDGE} 1px, transparent 1px), linear-gradient(to bottom, ${EDGE} 1px, transparent 1px)`,
          backgroundSize: `${100 / cols}% ${100 / rows}%`,
        }}
        className="relative touch-none rounded-sm border-2 border-sky-400/40 bg-surface-0"
      >
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
              style={{ left: `${live.fx * 100}%`, top: `${live.fy * 100}%` }}
              title={`${p.side === 'inputs' ? 'In' : 'Out'} ${p.index + 1}`}
              aria-label={`${p.side} ${p.index + 1} position`}
              className={`absolute size-3 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full ring-2 transition-transform hover:scale-125 active:cursor-grabbing ${tone}`}
            />
          )
        })}
      </div>
      <span className="text-[10px] text-gray-500">
        Drag ports onto the grid ({cols}×{rows})
      </span>
    </div>
  )
}
