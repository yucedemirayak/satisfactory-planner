import { useLayoutEffect, useState, type RefObject } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectPxPerMeter } from '@/features/floors/selectors'

import { connectionSelected } from '../connectionsSlice'
import { selectConnectionViews, selectSelectedConnectionId } from '../selectors'

interface Segment {
  id: string
  d: string
  over: boolean
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
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      setSegments([])
      return
    }
    const crect = container.getBoundingClientRect()
    const next: Segment[] = []
    for (const v of views) {
      const a = portCenter(container, crect, `${v.fromPlacementId}::out::${v.fromPort}`)
      const b = portCenter(container, crect, `${v.toPlacementId}::in::${v.toPort}`)
      if (!a || !b) continue
      const dx = Math.max(24, Math.abs(b.x - a.x) * 0.4)
      next.push({
        id: v.id,
        d: `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`,
        over: v.overCapacity,
        selected: v.id === selectedId,
      })
    }
    setSegments(next)
  }, [views, byFloor, floors, pxPerMeter, selectedId, containerRef, tick])

  // Re-measure on container/window resize (wrapping, scrollbar, zoom of page).
  useLayoutEffect(() => {
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
    <svg className="pointer-events-none absolute inset-0 size-full overflow-visible">
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
                  : 'stroke-gray-400'
            }
          />
        </g>
      ))}
    </svg>
  )
}
