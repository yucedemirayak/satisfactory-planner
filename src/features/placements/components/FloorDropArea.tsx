import { useDroppable } from '@dnd-kit/core'

import { useAppSelector } from '@/app/hooks'
import { selectGridSize, selectPxPerMeter } from '@/features/floors/selectors'
import {
  GhostNode,
  NodeItem,
  selectNodes,
  type NodeKind,
} from '@/features/nodes'

import type { FloorDropData } from '../dnd'
import { selectFloorPlacements } from '../selectors'
import type { Placement, PlacementKind } from '../types'
import { GhostItem } from './GhostItem'
import { PlacedItem } from './PlacedItem'

interface FloorDropAreaProps {
  floorId: string
  /** The dragged machine previewed as a ghost at its snapped x (or null). */
  ghost?: { kind: PlacementKind; refId: string; x: number } | null
  /** The dragged route node previewed as a ghost at its free 2D spot (or null). */
  nodeGhost?: { kind: NodeKind; x: number; y: number } | null
}

/** Droppable grid area covering a floor band; items are free-positioned by x. */
export function FloorDropArea({
  floorId,
  ghost = null,
  nodeGhost = null,
}: FloorDropAreaProps) {
  const placements = useAppSelector((s) => selectFloorPlacements(s, floorId))
  const nodes = useAppSelector(selectNodes).filter((n) => n.floorId === floorId)
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const gridSize = useAppSelector(selectGridSize)
  const workbenches = useAppSelector((s) => s.workbenches.items)
  const extractors = useAppSelector((s) => s.extractors.items)
  const generators = useAppSelector((s) => s.generators.items)
  const spacers = useAppSelector((s) => s.spacers.items)
  const data: FloorDropData = { type: 'floor', floorId }
  const { setNodeRef, isOver } = useDroppable({ id: `floor-${floorId}`, data })

  const widthOf = (p: Placement): number => {
    if (p.kind === 'workbench')
      return workbenches.find((w) => w.id === p.refId)?.width ?? 0
    if (p.kind === 'extractor')
      return extractors.find((e) => e.id === p.refId)?.width ?? 0
    if (p.kind === 'generator')
      return generators.find((g) => g.id === p.refId)?.width ?? 0
    return spacers.find((s) => s.id === p.refId)?.width ?? 0
  }

  // Right edge of the content, in px — an in-flow sizer of this width drives the
  // band width (absolute children don't), so the whole plan shares one scroll.
  const contentRight = placements.reduce(
    (max, p) => Math.max(max, p.x + widthOf(p)),
    0,
  )
  const gridPx = gridSize * pxPerMeter

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundImage: `repeating-linear-gradient(to right, rgba(255,255,255,0.06) 0 1px, transparent 1px ${gridPx}px)`,
      }}
      className={`relative flex h-full grow transition-colors ${
        isOver ? 'bg-ficsit/10 ring-2 ring-inset ring-ficsit/50' : ''
      }`}
    >
      {/* in-flow sizer: gives the area its intrinsic (content) width */}
      <div aria-hidden className="shrink-0" style={{ width: contentRight * pxPerMeter }} />

      {placements.map((p) => (
        <PlacedItem key={p.id} placement={p} floorId={floorId} />
      ))}
      {nodes.map((n) => (
        <NodeItem key={n.id} node={n} />
      ))}
      {ghost && <GhostItem kind={ghost.kind} refId={ghost.refId} x={ghost.x} />}
      {nodeGhost && (
        <GhostNode kind={nodeGhost.kind} x={nodeGhost.x} y={nodeGhost.y} />
      )}
    </div>
  )
}
