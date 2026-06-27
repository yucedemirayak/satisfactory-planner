import type { ReactNode } from 'react'

import { useAppSelector } from '@/app/hooks'

import { selectPxPerMeter } from '../selectors'
import type { Floor } from '../types'

interface FloorBandProps {
  floor: Floor
  label: string
  selected: boolean
  onSelect: () => void
  onRemove: () => void
  /** Optional content layer filling the band (e.g. a placements drop area). */
  children?: ReactNode
}

/** Minimum rendered band height so tiny floors stay clickable/readable. */
const MIN_BAND_PX = 18

/**
 * One floor drawn as a horizontal band whose pixel height is proportional to
 * the floor's height in metres. Clicking selects it; hovering reveals delete.
 * `children` (a placements drop area) is the in-flow content that drives the
 * band width, so the whole stack can share one horizontal scroll.
 */
export function FloorBand({
  floor,
  label,
  selected,
  onSelect,
  onRemove,
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
      className={`group/band relative flex min-w-full cursor-pointer overflow-hidden
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

      {/* height + delete */}
      <span className="absolute right-2 top-1 z-20 flex items-center gap-2">
        <span className="pointer-events-none rounded bg-surface-0/60 px-1.5 py-0.5 font-mono text-xs text-ficsit">
          {floor.height} m
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          title={`Delete ${label}`}
          aria-label={`Delete ${label}`}
          className={`flex size-6 items-center justify-center rounded bg-surface-0/60
            text-gray-400 transition hover:bg-red-500/20 hover:text-red-400
            group-hover/band:opacity-100 focus-visible:opacity-100 ${
              selected ? 'opacity-100' : 'opacity-0'
            }`}
        >
          ✕
        </button>
      </span>
    </div>
  )
}
