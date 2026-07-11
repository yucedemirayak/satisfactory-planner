/**
 * Shared drag-and-drop data contracts attached to draggables/droppables so the
 * single onDragEnd handler can tell what is being dragged and where it lands.
 */
import type { NodeKind } from '@/features/nodes'

import type { PlacementKind } from './types'

/** Data on a palette item being dragged in to create a new placement. */
export interface PaletteDragData {
  type: 'palette'
  kind: PlacementKind
  /** Workbench / Extractor / Generator definition id. */
  refId: string
}

/** Data on an existing placement being moved/reordered. */
export interface PlacementDragData {
  type: 'placement'
  floorId: string
  kind: PlacementKind
  refId: string
}

/** Data on a palette splitter/merger being dragged in to create a route node. */
export interface PaletteNodeDragData {
  type: 'palette-node'
  kind: NodeKind
}

/** Data on an existing route node being moved (free 2D). */
export interface NodeDragData {
  type: 'node'
  floorId: string
  kind: NodeKind
}

/** Data on a floor's droppable area. */
export interface FloorDropData {
  type: 'floor'
  floorId: string
}

export type DragData =
  | PaletteDragData
  | PlacementDragData
  | PaletteNodeDragData
  | NodeDragData
export type DropData = PlacementDragData | FloorDropData
