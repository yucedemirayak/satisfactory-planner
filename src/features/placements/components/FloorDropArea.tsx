import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'

import { useAppDispatch, useAppSelector } from '@/app/hooks'

import type { FloorDropData } from '../dnd'
import { placementSelected } from '../placementsSlice'
import { selectFloorPlacements } from '../selectors'
import { PlacedItem } from './PlacedItem'

interface FloorDropAreaProps {
  floorId: string
  /** Index where an incoming item would land — opens an animated gap there. */
  gapIndex?: number | null
  /** Width (px) of the gap to open for the incoming item. */
  gapWidth?: number
}

/** Droppable, horizontally-sortable area covering a floor band. */
export function FloorDropArea({
  floorId,
  gapIndex = null,
  gapWidth = 0,
}: FloorDropAreaProps) {
  const dispatch = useAppDispatch()
  const placements = useAppSelector((s) => selectFloorPlacements(s, floorId))
  const data: FloorDropData = { type: 'floor', floorId }
  const { setNodeRef, isOver } = useDroppable({ id: `floor-${floorId}`, data })

  return (
    <div
      ref={setNodeRef}
      // Clicking empty floor space (blocks stopPropagation) clears the selection.
      onClick={() => dispatch(placementSelected(null))}
      // in-flow flex item: sizes to its content (driving the band width) and
      // grows to fill when the band is stretched to match the widest floor.
      className={`flex h-full grow items-end gap-1 rounded-sm py-1 pr-2 pl-1
        transition-colors ${
          isOver ? 'bg-ficsit/15 ring-2 ring-inset ring-ficsit/60' : ''
        }`}
    >
      <SortableContext
        items={placements.map((p) => p.id)}
        strategy={horizontalListSortingStrategy}
      >
        {placements.map((p, i) => (
          <PlacedItem
            key={p.id}
            placement={p}
            floorId={floorId}
            gapBefore={gapIndex === i ? gapWidth : 0}
          />
        ))}
      </SortableContext>
      {/* trailing spacer animates open when the drop lands at the end */}
      <div
        aria-hidden
        className="h-px shrink-0 self-end transition-[width] duration-150"
        style={{ width: gapIndex === placements.length ? gapWidth : 0 }}
      />
    </div>
  )
}
