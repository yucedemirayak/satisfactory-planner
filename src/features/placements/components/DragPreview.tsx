import { useAppSelector } from '@/app/hooks'
import { selectPxPerMeter } from '@/features/floors/selectors'

import type { PlacementKind } from '../types'

interface DragPreviewProps {
  kind: PlacementKind
  refId: string
}

/** Floating clone rendered in the DndContext's DragOverlay while dragging. */
export function DragPreview({ kind, refId }: DragPreviewProps) {
  const workbench = useAppSelector((s) =>
    s.workbenches.items.find((w) => w.id === refId),
  )
  const extractor = useAppSelector((s) =>
    s.extractors.items.find((e) => e.id === refId),
  )
  const spacer = useAppSelector((s) => s.spacers.items.find((sp) => sp.id === refId))
  const pxPerMeter = useAppSelector(selectPxPerMeter)

  // Coloured box for workbenches & extractors.
  const box = kind === 'extractor' ? extractor : kind === 'workbench' ? workbench : undefined
  if (box) {
    return (
      <div
        style={{
          width: Math.max(24, box.width * pxPerMeter),
          height: Math.max(24, box.height * pxPerMeter),
          borderColor: box.color,
          backgroundColor: `${box.color}55`,
        }}
        className="scale-105 cursor-grabbing overflow-hidden rounded-sm border-2 shadow-2xl shadow-black/50 ring-2 ring-ficsit/50"
      >
        <span className="pointer-events-none m-1 block truncate text-[10px] font-medium text-gray-100">
          {box.name}
        </span>
      </div>
    )
  }

  if (!spacer) return null
  return (
    <div
      style={{ width: Math.max(24, spacer.width * pxPerMeter), height: 48 }}
      className="flex scale-105 cursor-grabbing items-center justify-center rounded-sm border-2 border-dashed border-gray-400 bg-gray-700/70 shadow-2xl shadow-black/50 ring-2 ring-ficsit/40"
    >
      <span className="pointer-events-none truncate px-1 text-[10px] font-medium text-gray-300">
        {spacer.width}m
      </span>
    </div>
  )
}
