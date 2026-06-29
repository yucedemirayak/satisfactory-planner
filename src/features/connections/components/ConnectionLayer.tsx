import { useEffect, useState, type RefObject } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectPxPerMeter } from '@/features/floors/selectors'

import { connectionSelected } from '../connectionsSlice'
import { selectConnectionViews, selectSelectedConnectionId } from '../selectors'

interface Segment {
  id: string
  d: string
  over: boolean
  mismatch: boolean
  selected: boolean
}

const portCenter = (
  container: HTMLElement,
  crect: DOMRect,
  key: string,
): { x: number; y: number } | null => {
  const el = container.querySelector(`[data-port="${key}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2 - crect.left, y: r.top + r.height / 2 - crect.top }
}

interface Pt {
  x: number
  y: number
}

/**
 * Build an SVG path through `pts` using only horizontal/vertical runs with sharp
 * 90° corners (so shared trunks read as clean T-junctions). Consecutive duplicate
 * points are dropped first so we don't emit redundant segments.
 */
function orthPath(pts: Pt[]): string {
  const p: Pt[] = []
  for (const q of pts) {
    const last = p[p.length - 1]
    if (!last || last.x !== q.x || last.y !== q.y) p.push(q)
  }
  if (p.length < 2) return ''
  return p.map((q, i) => `${i === 0 ? 'M' : 'L'} ${q.x} ${q.y}`).join(' ')
}

/**
 * SVG overlay drawing each connection as a curve between its source output and
 * target input port. Lives inside the (scrolling, zooming) plan content, so port
 * positions are measured relative to `containerRef` and stay correct on scroll.
 */
export function ConnectionLayer({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>
}) {
  const dispatch = useAppDispatch()
  const views = useAppSelector(selectConnectionViews)
  const byFloor = useAppSelector((s) => s.placements.byFloor)
  const floors = useAppSelector((s) => s.floors.items)
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const selectedId = useAppSelector(selectSelectedConnectionId)
  const [segments, setSegments] = useState<Segment[]>([])
  const [tick, setTick] = useState(0)

  // Re-measure port positions whenever layout-affecting state changes.
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      setSegments([])
      return
    }
    const measure = () => {
      const crect = container.getBoundingClientRect()
      const next: Segment[] = []
      for (const v of views) {
        const a = portCenter(container, crect, `${v.from.id}::out::${v.from.port}`)
        const b = portCenter(container, crect, `${v.to.id}::in::${v.to.port}`)
        if (!a || !b) continue
        // Orthogonal route: run vertically from the output along a "trunk"
        // directly above it, to the target's row, then turn into the input.
        // Output ports sit on the top edge (each at its own x), so every link
        // from the same output port resolves to the same trunk x → their vertical
        // runs coincide (one shared trunk, no double lines) and extra links branch
        // off as T-junctions.
        next.push({
          id: v.id,
          d: orthPath([
            { x: a.x, y: a.y },
            { x: a.x, y: b.y },
            { x: b.x, y: b.y },
          ]),
          over: v.overCapacity,
          mismatch: v.mismatch,
          selected: v.id === selectedId,
        })
      }
      setSegments(next)
    }
    measure()
    // Re-measure after paint: on the first open the layout (grid/flex sizing,
    // fonts) may not be settled when this effect first runs, so ports report
    // wrong/zero positions and lines don't render until an unrelated re-render.
    // A next-frame pass fixes the initial render.
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [views, byFloor, floors, pxPerMeter, selectedId, containerRef, tick])

  // Re-measure on container/window resize (wrapping, scrollbar, zoom of page).
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => setTick((t) => t + 1))
    ro.observe(container)
    const onResize = () => setTick((t) => t + 1)
    window.addEventListener('resize', onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [containerRef])

  if (segments.length === 0) return null
  return (
    <svg className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible">
      {segments.map((s) => (
        <g key={s.id}>
          {/* fat invisible hit target for easy selection */}
          <path
            d={s.d}
            fill="none"
            stroke="transparent"
            strokeWidth={14}
            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            onClick={(e) => {
              // A port under the pointer wins: forward the click so wiring still
              // works where a belt crosses an input/output node, instead of
              // selecting the line. (Belt-and-suspenders with the port z-layer.)
              const port = document
                .elementsFromPoint(e.clientX, e.clientY)
                .find(
                  (el): el is HTMLElement =>
                    el instanceof HTMLElement && el.hasAttribute('data-port'),
                )
              if (port) {
                port.click()
                return
              }
              e.stopPropagation()
              dispatch(connectionSelected(s.id))
            }}
          />
          <path
            d={s.d}
            fill="none"
            strokeLinecap="round"
            strokeWidth={s.selected ? 3 : 2}
            style={{ pointerEvents: 'none' }}
            className={
              s.selected
                ? 'stroke-ficsit'
                : s.over
                  ? 'stroke-red-500'
                  : s.mismatch
                    ? 'stroke-amber-500'
                    : 'stroke-gray-400'
            }
          />
        </g>
      ))}
    </svg>
  )
}
