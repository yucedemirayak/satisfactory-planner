import { useDraggable } from '@dnd-kit/core'
import type { ReactNode } from 'react'

import type { PaletteDragData, PaletteNodeDragData } from '../dnd'

interface PaletteItemProps {
  dndId: string
  data: PaletteDragData | PaletteNodeDragData
  children: ReactNode
}

/**
 * Generic draggable palette row. Stays in place while dragging (a DragOverlay
 * renders the floating preview), just dims to show it's active.
 */
export function PaletteItem({ dndId, data, children }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dndId,
    data,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      // touch-manipulation (NOT touch-none): a swipe starting on the row must
      // still scroll the palette — the browser owns the gesture until the
      // TouchSensor's long-press delay promotes it to a drag.
      className="flex cursor-grab touch-manipulation items-center gap-2 rounded-md
        border border-edge bg-surface-2 px-2.5 py-2 transition
        hover:border-ficsit/60 active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}
