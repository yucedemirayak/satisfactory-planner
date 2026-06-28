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
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useEffect, useRef, useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  FloorGridControl,
  FloorInspector,
  FloorScaleControl,
  FloorStack,
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

interface DropTarget {
  floorId: string
  /** Snapped left position (metres) where the dragged item would land. */
  x: number
}

interface ActiveDrag {
  kind: PlacementKind
  refId: string
}

/**
 * Target the plan only when the pointer is actually inside a droppable (a floor
 * area or a placed block). Releasing anywhere else yields no collision → `over`
 * is null → the drop is a no-op and the item stays exactly where it was. When
 * the pointer is inside the plan we defer to closestCenter (keeps the nice
 * insert-between ordering). Keyboard dnd has no pointer, so it falls back too.
 */
const collisionDetection: CollisionDetection = (args) => {
  // Forgiving while the drag overlaps the plan — pointer inside a droppable OR
  // the dragged item's rect intersecting any floor/block — so the live drop gap
  // (and insert-between ordering) shows via closestCenter. Only a fully-outside
  // release yields no collision → `over` is null → no-op drop. Keyboard dnd has
  // no pointer, so it falls back too.
  if (
    pointerWithin(args).length > 0 ||
    rectIntersection(args).length > 0 ||
    args.pointerCoordinates == null
  ) {
    return closestCenter(args)
  }
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

  // Esc cancels a mid-wiring source pick and deselects any connection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      dispatch(connectionSourceCleared())
      dispatch(connectionSelected(null))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

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
  const resolveDrop = (event: DragOverEvent | DragEndEvent) => {
    const { active, over } = event
    if (!over) return null
    const activeData = active.data.current as DragData | undefined
    const overData = over.data.current as DropData | undefined
    const activeRect = active.rect.current.translated
    if (!activeData || !overData || !activeRect) return null
    // Item's left relative to the floor area, snapped to the grid.
    const leftPx = activeRect.left - over.rect.left
    const x = Math.max(0, Math.round(leftPx / pxPerMeter / gridSize) * gridSize)
    return { activeData, floorId: overData.floorId, x }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined
    setActiveDrag(data ? { kind: data.kind, refId: data.refId } : null)
    document.body.classList.add('dnd-dragging')
  }

  const handleDragOver = (event: DragOverEvent) => {
    const res = resolveDrop(event)
    setDropTarget((prev) => {
      if (!res) return null
      if (prev && prev.floorId === res.floorId && prev.x === res.x) return prev
      return { floorId: res.floorId, x: res.x }
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
    const { activeData, floorId, x } = res

    if (activeData.type === 'palette') {
      dispatch(
        placementAdded({
          kind: activeData.kind,
          refId: activeData.refId,
          floorId,
          x,
        }),
      )
    } else {
      dispatch(
        placementMoved({
          placementId: String(event.active.id),
          toFloorId: floorId,
          x,
        }),
      )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
                  // Ghost the dragged item at its snapped landing spot on the
                  // floor the pointer is over (the original block dims in place).
                  const showGhost =
                    activeDrag !== null && dropTarget?.floorId === floor.id
                  return (
                    <FloorDropArea
                      floorId={floor.id}
                      ghost={
                        showGhost
                          ? {
                              kind: activeDrag.kind,
                              refId: activeDrag.refId,
                              x: dropTarget.x,
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
            <ConnectionInspector />
          </div>
        </div>
      </section>

      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {activeDrag ? (
          <DragPreview kind={activeDrag.kind} refId={activeDrag.refId} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default FloorPlanPage
