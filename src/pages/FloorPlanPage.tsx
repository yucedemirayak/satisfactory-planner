import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  FloorGridControl,
  FloorInspector,
  FloorPortControl,
  FloorScaleControl,
  FloorStack,
  floorSelected,
  selectFloorCount,
  selectGridSize,
  selectPxPerMeter,
  selectTotalHeight,
} from '@/features/floors'
import {
  DragPreview,
  FloorDropArea,
  Palette,
  PlacementInspector,
  placementAdded,
  placementMoved,
  placementSelected,
  selectFactoryFootprint,
  type DragData,
  type DropData,
} from '@/features/placements'
import type { PlacementKind } from '@/features/placements/types'
import {
  ConnectionInspector,
  ConnectionLayer,
  connectionSelected,
  connectionSourceCleared,
  selectConnectionSource,
} from '@/features/connections'
import {
  NodeInspector,
  NodePreview,
  nodeAdded,
  nodeMoved,
  nodeSelected,
  type NodeKind,
} from '@/features/nodes'

interface DropTarget {
  floorId: string
  /** Left position (metres) where the dragged item would land (machines snap). */
  x: number
  /** Top position (metres) — only used by free-positioned route nodes. */
  y: number
}

type ActiveDrag =
  | { type: 'machine'; kind: PlacementKind; refId: string }
  | { type: 'node'; kind: NodeKind }

/**
 * Target the plan only when the pointer is actually inside a droppable (a floor
 * area or a placed block). Releasing anywhere else yields no collision → `over`
 * is null → the drop is a no-op and the item stays exactly where it was. When
 * the pointer is inside the plan we defer to closestCenter (keeps the nice
 * insert-between ordering). Keyboard dnd has no pointer, so it falls back too.
 */
const collisionDetection: CollisionDetection = (args) => {
  // Prefer the floor actually under the pointer, so the ghost (and the drop)
  // targets the cursor's floor. closestCenter compares the *dragged item's* rect
  // centre to floor centres, so a tall item straddling floors snaps to a
  // neighbour and the ghost lands on the wrong floor (looking absent). Fall back
  // to rect overlap, then — only for keyboard dnd, which has no pointer —
  // closestCenter. A fully-outside release yields no collision → `over` is null
  // → no-op drop.
  const pointer = pointerWithin(args)
  if (pointer.length > 0) return pointer
  const intersecting = rectIntersection(args)
  if (intersecting.length > 0) return intersecting
  if (args.pointerCoordinates == null) return closestCenter(args)
  return []
}

/** Smooth "settle into place" on drop, with a slight overshoot. */
const DROP_ANIMATION: DropAnimation = {
  duration: 200,
  easing: 'cubic-bezier(0.2, 0.8, 0.4, 1.1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.4' } },
  }),
}

/**
 * The /floors page: drag workbenches from the palette onto floors. Owns the
 * single DndContext spanning the palette and every floor's drop area.
 */
function FloorPlanPage() {
  const dispatch = useAppDispatch()
  const count = useAppSelector(selectFloorCount)
  const totalHeight = useAppSelector(selectTotalHeight)
  const footprint = useAppSelector(selectFactoryFootprint)
  const pendingFrom = useAppSelector(selectConnectionSource)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const gridSize = useAppSelector(selectGridSize)
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  // Clear every selection (wiring source, connection, placement, node, floor).
  const deselectAll = useCallback(() => {
    dispatch(connectionSourceCleared())
    dispatch(connectionSelected(null))
    dispatch(placementSelected(null))
    dispatch(nodeSelected(null))
    dispatch(floorSelected(null))
  }, [dispatch])

  // Esc deselects everything.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') deselectAll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deselectAll])

  const sensors = useSensors(
    // Mouse: small drag distance starts a drag.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Touch: long-press so a normal swipe still scrolls the plan.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /**
   * Resolve a drag to a target floor + snapped left position (metres). The only
   * droppables are floor areas (placements are free-draggable, not droppable),
   * so `over` is always a floor. Null when released outside the plan → no-op.
   */
  const resolveDrop = (event: DragMoveEvent | DragEndEvent) => {
    const { active, over, delta } = event
    if (!over) return null
    const activeData = active.data.current as DragData | undefined
    const overData = over.data.current as DropData | undefined
    const initial = active.rect.current.initial
    if (!activeData || !overData || !initial) return null
    // Dragged item's current top-left = where it started + how far it moved.
    // We derive it from the start rect + drag delta rather than the live
    // "translated" rect: with a DragOverlay the source node never gets a
    // transform, so its translated rect stays at the origin and the ghost would
    // stick to the item's original spot instead of following the cursor.
    const leftPx = initial.left + delta.x - over.rect.left
    const topPx = initial.top + delta.y - over.rect.top
    const isNode =
      activeData.type === 'palette-node' || activeData.type === 'node'
    // Route nodes are free-positioned (2D, no grid); machines snap x to the grid.
    const x = isNode
      ? Math.max(0, leftPx / pxPerMeter)
      : Math.max(0, Math.round(leftPx / pxPerMeter / gridSize) * gridSize)
    const y = Math.max(0, topPx / pxPerMeter)
    return { activeData, floorId: overData.floorId, x, y }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined
    if (data?.type === 'palette-node' || data?.type === 'node') {
      setActiveDrag({ type: 'node', kind: data.kind })
    } else if (data) {
      setActiveDrag({ type: 'machine', kind: data.kind, refId: data.refId })
    } else {
      setActiveDrag(null)
    }
    document.body.classList.add('dnd-dragging')
  }

  // Update the ghost on every move (not onDragOver, which only fires when the
  // `over` target itself changes — so dragging *within* one floor would never
  // refresh the snapped x and the ghost would stick to its starting spot).
  const handleDragMove = (event: DragMoveEvent) => {
    const res = resolveDrop(event)
    setDropTarget((prev) => {
      if (!res) return null
      if (
        prev &&
        prev.floorId === res.floorId &&
        prev.x === res.x &&
        prev.y === res.y
      )
        return prev
      return { floorId: res.floorId, x: res.x, y: res.y }
    })
  }

  const resetDrag = () => {
    setActiveDrag(null)
    setDropTarget(null)
    document.body.classList.remove('dnd-dragging')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    resetDrag()
    const res = resolveDrop(event)
    if (!res) return
    const { activeData, floorId, x, y } = res

    if (activeData.type === 'palette') {
      dispatch(
        placementAdded({
          kind: activeData.kind,
          refId: activeData.refId,
          floorId,
          x,
        }),
      )
    } else if (activeData.type === 'placement') {
      dispatch(
        placementMoved({
          placementId: String(event.active.id),
          toFloorId: floorId,
          x,
        }),
      )
    } else if (activeData.type === 'palette-node') {
      dispatch(nodeAdded({ kind: activeData.kind, floorId, x, y }))
    } else {
      dispatch(nodeMoved({ id: String(event.active.id), floorId, x, y }))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDrag}
    >
      <section className="flex h-full flex-col gap-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-100">Floor Plan</h1>
            <p className="text-sm text-gray-500">
              Design your megafactory floor by floor.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <FloorPortControl />
            <FloorGridControl />
            <FloorScaleControl />
            <dl className="flex gap-6 text-right">
              <div>
                <dt className="text-xs text-gray-500">Floors</dt>
                <dd className="font-mono text-lg text-ficsit">{count}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Total width</dt>
                <dd className="font-mono text-lg text-ficsit">
                  {Math.round(footprint.width * 10) / 10} m
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Total depth</dt>
                <dd className="font-mono text-lg text-ficsit">
                  {Math.round(footprint.depth * 10) / 10} m
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Total height</dt>
                <dd className="font-mono text-lg text-ficsit">{totalHeight} m</dd>
              </div>
            </dl>
          </div>
        </header>

        {pendingFrom && (
          <p className="rounded-md border border-ficsit/40 bg-ficsit/10 px-3 py-1.5 text-sm text-ficsit">
            Pick a matching <span className="font-medium">input</span> port to
            connect — or press Esc to cancel.
          </p>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[13rem_1fr_18rem] gap-4">
          <Palette />

          <div className="min-h-0 overflow-auto rounded-lg border border-edge bg-surface-1 p-4">
            <div ref={contentRef} className="relative isolate w-max min-w-full">
              <FloorStack
                renderFloorContent={(floor) => {
                  // Ghost the dragged item at its landing spot on the floor the
                  // pointer is over (the original dims in place): a machine snaps
                  // to the grid, a route node lands at a free 2D position.
                  const onFloor = dropTarget?.floorId === floor.id
                  return (
                    <FloorDropArea
                      floorId={floor.id}
                      ghost={
                        onFloor && activeDrag?.type === 'machine'
                          ? {
                              kind: activeDrag.kind,
                              refId: activeDrag.refId,
                              x: dropTarget.x,
                            }
                          : null
                      }
                      nodeGhost={
                        onFloor && activeDrag?.type === 'node'
                          ? {
                              kind: activeDrag.kind,
                              x: dropTarget.x,
                              y: dropTarget.y,
                            }
                          : null
                      }
                    />
                  )
                }}
              />
              <ConnectionLayer containerRef={contentRef} />
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
            <FloorInspector />
            <PlacementInspector />
            <NodeInspector />
            <ConnectionInspector />
          </div>
        </div>
      </section>

      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {activeDrag?.type === 'machine' ? (
          <DragPreview kind={activeDrag.kind} refId={activeDrag.refId} />
        ) : activeDrag?.type === 'node' ? (
          <NodePreview kind={activeDrag.kind} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default FloorPlanPage
