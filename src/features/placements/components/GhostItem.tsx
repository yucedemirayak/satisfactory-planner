import type { CSSProperties } from 'react'

import { useAppSelector } from '@/app/hooks'
import { selectPxPerMeter } from '@/features/floors/selectors'

import type { PlacementKind } from '../types'
import { MIN_BLOCK_PX } from './PlacedItem'

interface GhostItemProps {
  kind: PlacementKind
  refId: string
  /** Snapped left position in metres where the item would land. */
  x: number
}

/**
 * A faded silhouette of the dragged item at its snapped landing spot, so you see
 * WHAT and WHERE it will drop (absolutely positioned within the floor area).
 */
export function GhostItem({ kind, refId, x }: GhostItemProps) {
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const workbench = useAppSelector((s) =>
    s.workbenches.items.find((w) => w.id === refId),
  )
  const extractor = useAppSelector((s) =>
    s.extractors.items.find((e) => e.id === refId),
  )
  const generator = useAppSelector((s) =>
    s.generators.items.find((g) => g.id === refId),
  )

  const box =
    kind === 'extractor'
      ? extractor
      : kind === 'generator'
        ? generator
        : workbench
  if (!box) return null

  const base: CSSProperties = {
    position: 'absolute',
    left: x * pxPerMeter,
    width: Math.max(MIN_BLOCK_PX, box.width * pxPerMeter),
  }

  return (
    <div
      aria-hidden
      style={{
        ...base,
        bottom: 0,
        height: Math.max(MIN_BLOCK_PX, box.height * pxPerMeter),
        borderColor: box.color,
        backgroundColor: `${box.color}1f`,
      }}
      className="pointer-events-none overflow-hidden rounded-sm border-2 border-dashed opacity-60"
    >
      <span className="m-1 block truncate text-[10px] font-medium text-gray-300">
        {box.name}
      </span>
    </div>
  )
}
