/**
 * Shared drag-and-drop data contracts attached to draggables/droppables so the
 * single onDragEnd handler can tell what is being dragged and where it lands.
 */
import type { PlacementKind } from './types'

/** Data on a palette item being dragged in to create a new placement. */
export interface PaletteDragData {
  type: 'palette'
  kind: PlacementKind
  /** Workbench/Spacer definition id. */
  refId: string
}

/** Data on an existing placement being moved/reordered. */
export interface PlacementDragData {
  type: 'placement'
  floorId: string
  kind: PlacementKind
  refId: string
}

/** Data on a floor's droppable area. */
export interface FloorDropData {
  type: 'floor'
  floorId: string
}

export type DragData = PaletteDragData | PlacementDragData
export type DropData = PlacementDragData | FloorDropData
