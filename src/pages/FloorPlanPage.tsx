import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useEffect, useRef, useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  FloorInspector,
  FloorScaleControl,
  FloorStack,
  selectFloorCount,
  selectPxPerMeter,
  selectTotalHeight,
} from '@/features/floors'
import {
  DragPreview,
  FloorDropArea,
  MIN_BLOCK_PX,
  Palette,
  PlacementInspector,
  placementAdded,
  placementMoved,
  selectFactoryFootprint,
  selectPlacementsByFloor,
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
import { selectExtractors } from '@/features/extractors'
import { selectSpacers } from '@/features/spacers'
import { selectWorkbenches } from '@/features/workbenches/selectors'

interface DropTarget {
  floorId: string
  /** Insertion index within the floor's placement list. */
  index: number
}

interface ActiveDrag {
  kind: PlacementKind
  refId: string
  /** Source floor for an existing placement; null for palette items. */
  sourceFloorId: string | null
  /** Rendered width (px) of the dragged item, for the live drop gap. */
  width: number
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
  const byFloor = useAppSelector(selectPlacementsByFloor)
  const workbenches = useAppSelector(selectWorkbenches)
  const extractors = useAppSelector(selectExtractors)
  const spacers = useAppSelector(selectSpacers)
  const pxPerMeter = useAppSelector(selectPxPerMeter)
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

  /** Rendered width (px) of an item by kind+refId, for the live drop gap. */
  const itemWidth = (kind: PlacementKind, refId: string) => {
    const def =
      kind === 'workbench'
        ? workbenches.find((w) => w.id === refId)
        : kind === 'extractor'
          ? extractors.find((e) => e.id === refId)
          : spacers.find((s) => s.id === refId)
    return Math.max(MIN_BLOCK_PX, (def?.width ?? 0) * pxPerMeter)
  }

  /**
   * Resolve where a drag currently points: which floor, before/after which
   * block (`overId`/`after`) and the resulting insertion `index`. Shared by the
   * live drop gap (onDragOver) and the commit (onDragEnd) so they agree.
   */
  const resolveDrop = (event: DragOverEvent | DragEndEvent) => {
    const { active, over } = event
    if (!over) return null
    const activeData = active.data.current as DragData | undefined
    const overData = over.data.current as DropData | undefined
    if (!activeData || !overData) return null

    const floorId = overData.floorId
    const list = byFloor[floorId] ?? []

    let overId: string | null = null
    let after = false
    if (overData.type === 'placement') {
      overId = String(over.id)
      // Pick before/after by which half of the block the drag centre is on.
      const activeRect = active.rect.current.translated
      if (activeRect) {
        const activeCenterX = activeRect.left + activeRect.width / 2
        const overCenterX = over.rect.left + over.rect.width / 2
        after = activeCenterX > overCenterX
      }
    }

    const overIdx = overId ? list.findIndex((p) => p.id === overId) : -1
    const index = overIdx === -1 ? list.length : overIdx + (after ? 1 : 0)
    return { activeData, floorId, overId, after, index }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined
    setActiveDrag(
      data
        ? {
            kind: data.kind,
            refId: data.refId,
            sourceFloorId: data.type === 'placement' ? data.floorId : null,
            width: itemWidth(data.kind, data.refId),
          }
        : null,
    )
    document.body.classList.add('dnd-dragging')
  }

  const handleDragOver = (event: DragOverEvent) => {
    const res = resolveDrop(event)
    setDropTarget((prev) => {
      if (!res) return null
      if (prev && prev.floorId === res.floorId && prev.index === res.index) {
        return prev
      }
      return { floorId: res.floorId, index: res.index }
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
    const { activeData, floorId, overId, after } = res

    if (activeData.type === 'palette') {
      dispatch(
        placementAdded({
          kind: activeData.kind,
          refId: activeData.refId,
          floorId,
          overId,
          after,
        }),
      )
    } else {
      const placementId = String(event.active.id)
      if (placementId === overId) return
      dispatch(placementMoved({ placementId, toFloorId: floorId, overId, after }))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
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
            <div ref={contentRef} className="relative w-max min-w-full">
              <FloorStack
                renderFloorContent={(floor) => {
                  // Open a gap only when the dragged item is *incoming* to this
                  // floor (palette, or moved from another floor). Same-floor
                  // reordering is handled by dnd-kit's native sortable shifting.
                  const isTarget = dropTarget?.floorId === floor.id
                  const incoming =
                    activeDrag !== null && activeDrag.sourceFloorId !== floor.id
                  return (
                    <FloorDropArea
                      floorId={floor.id}
                      gapIndex={isTarget && incoming ? dropTarget.index : null}
                      gapWidth={activeDrag?.width ?? 0}
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
