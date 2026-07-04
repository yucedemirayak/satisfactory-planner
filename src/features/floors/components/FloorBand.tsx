import type { ReactNode } from 'react'

import { useAppSelector } from '@/app/hooks'

import { selectPxPerMeter } from '../selectors'
import type { Floor } from '../types'

interface FloorBandProps {
  floor: Floor
  label: string
  selected: boolean
  onSelect: () => void
  /** Optional content layer filling the band (e.g. a placements drop area). */
  children?: ReactNode
}

/** Minimum rendered band height so tiny floors stay clickable/readable. */
const MIN_BAND_PX = 18

/**
 * One floor drawn as a horizontal band whose pixel height is proportional to
 * the floor's height in metres. Clicking selects it; deleting happens in the
 * FloorInspector. `children` (a placements drop area) is the in-flow content
 * that drives the band width, so the whole stack can share one horizontal
 * scroll.
 */
export function FloorBand({
  floor,
  label,
  selected,
  onSelect,
  children,
}: FloorBandProps) {
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const pxHeight = Math.max(MIN_BAND_PX, floor.height * pxPerMeter)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      style={{ height: pxHeight }}
      className={`relative flex min-w-full cursor-pointer overflow-hidden
        rounded-sm border text-left transition-colors focus-visible:outline-none ${
          selected
            ? 'border-ficsit bg-ficsit/10 ring-1 ring-ficsit'
            : 'border-edge bg-surface-2 hover:border-ficsit/60 hover:bg-surface-3'
        }`}
    >
      {/* hatched industrial backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 9px)',
        }}
      />

      {/* placements layer — in-flow, grows to drive the band width */}
      {children}

      {/* floor label */}
      <span className="pointer-events-none absolute left-2 top-1 z-20 max-w-[60%] truncate rounded bg-surface-0/60 px-1.5 py-0.5 text-sm font-semibold text-gray-100">
        {label}
      </span>

      {/* floor height badge */}
      <span className="pointer-events-none absolute right-2 top-1 z-20 rounded bg-surface-0/60 px-1.5 py-0.5 font-mono text-xs text-ficsit">
        {floor.height} m
      </span>
    </div>
  )
}
