import { useDraggable } from '@dnd-kit/core'
import type { CSSProperties } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  connectionAdded,
  connectionSourceSet,
} from '@/features/connections/connectionsSlice'
import { selectConnectionSource } from '@/features/connections/selectors'
import { selectPortScale, selectPxPerMeter } from '@/features/floors/selectors'
import {
  centerPorts,
  edgePorts,
  portPosStyle,
  resolvePorts,
  type PortPos,
} from '@/features/ports'

import type { PlacementDragData } from '../dnd'
import { placementRemoved, placementSelected } from '../placementsSlice'
import {
  selectOverlappingPlacementIds,
  selectSelectedPlacementId,
} from '../selectors'
import type { Placement } from '../types'

interface PlacedItemProps {
  placement: Placement
  floorId: string
}

export const MIN_BLOCK_PX = 20

/**
 * An item sitting on a floor — a workbench / extractor (coloured block) or a
 * spacer (dashed full-height gap). Draggable to reorder / move; click to select.
 */
export function PlacedItem({ placement, floorId }: PlacedItemProps) {
  const dispatch = useAppDispatch()
  const workbench = useAppSelector((s) =>
    s.workbenches.items.find((w) => w.id === placement.refId),
  )
  const extractor = useAppSelector((s) =>
    s.extractors.items.find((e) => e.id === placement.refId),
  )
  const spacer = useAppSelector((s) =>
    s.spacers.items.find((sp) => sp.id === placement.refId),
  )
  const recipe = useAppSelector((s) =>
    placement.recipeId
      ? s.recipes.items.find((r) => r.id === placement.recipeId)
      : undefined,
  )
  const material = useAppSelector((s) =>
    placement.materialId
      ? s.materials.items.find((m) => m.id === placement.materialId)
      : undefined,
  )
  const selected = useAppSelector(selectSelectedPlacementId) === placement.id
  const overlapping = useAppSelector(selectOverlappingPlacementIds).has(
    placement.id,
  )
  const pxPerMeter = useAppSelector(selectPxPerMeter)
  const portScale = useAppSelector(selectPortScale)
  const pendingFrom = useAppSelector(selectConnectionSource)
  // New links default to the first conveyor; the flow graph auto-switches a
  // fluid line to a pipeline based on the carried item's phase.
  const defaultTransportId = useAppSelector(
    (s) => s.conveyors.items[0]?.id ?? '',
  )

  const data: PlacementDragData = {
    type: 'placement',
    floorId,
    kind: placement.kind,
    refId: placement.refId,
  }
  // useDraggable (not sortable): the item is free-positioned by x; the moving
  // visual is the DragOverlay clone, so the original just dims while dragging.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: placement.id,
    data,
  })

  const isExtractor = placement.kind === 'extractor'
  const isSpacer = placement.kind === 'spacer'
  // Workbenches and extractors are coloured boxes; spacers are dashed gaps.
  const box = isExtractor ? extractor : workbench
  const def = isSpacer ? spacer : box
  if (!def) return null

  const width = Math.max(MIN_BLOCK_PX, def.width * pxPerMeter)
  // Secondary line: recipe (workbench) or material (extractor).
  const subLabel = isExtractor
    ? material?.name || (placement.materialId ? 'Material' : null)
    : recipe
      ? recipe.name.trim() || 'Recipe'
      : null

  // Port slots come from the building definition (fixed count). On a workbench
  // the assigned recipe fills them in order; on an extractor every output slot
  // carries the assigned material. A slot with no item is empty (faded, not
  // wireable). Value = the carried item's refId, or null when empty. Each
  // port sits on its configured edge; ports sharing an edge are spread evenly.
  const portDescs: {
    type: 'in' | 'out'
    index: number
    refId: string | null
    pos: PortPos
  }[] =
    !isExtractor && workbench
      ? [
          ...resolvePorts(
            workbench.inputPorts,
            edgePorts(workbench.inputs, 'left'),
          ).map((pos, i) => ({
            type: 'in' as const,
            index: i,
            refId: recipe?.inputs[i]?.refId || null,
            pos,
          })),
          ...resolvePorts(
            workbench.outputPorts,
            edgePorts(workbench.outputs, 'right'),
          ).map((pos, i) => ({
            type: 'out' as const,
            index: i,
            refId: recipe?.outputs[i]?.refId || null,
            pos,
          })),
        ]
      : isExtractor && extractor
        ? resolvePorts(
            extractor.outputPorts,
            centerPorts(extractor.outputs),
          ).map((pos, i) => ({
            type: 'out' as const,
            index: i,
            refId: placement.materialId || null,
            pos,
          }))
        : []
  const showPorts = portDescs.length > 0

  // Two-click wiring: click an output (source), then a matching input (target).
  const portBase =
    'pointer-events-auto cursor-pointer rounded-full ring-1 transition hover:scale-125'
  // Ports are a fixed pixel size (user-adjustable) so they stay clickable at any zoom.
  const portStyle: CSSProperties = { width: portScale, height: portScale }
  const pickSource = (port: number, refId: string) =>
    dispatch(
      connectionSourceSet({ ref: 'placement', id: placement.id, port, refId }),
    )
  const completeTo = (port: number, refId: string) => {
    if (!pendingFrom) return
    if (pendingFrom.ref === 'placement' && pendingFrom.id === placement.id) return
    // Item must match when the source item is known (machine output). A route
    // node's carried item is unknown here (refId null) → accept; the flow graph
    // validates it.
    if (pendingFrom.refId !== null && pendingFrom.refId !== refId) return
    dispatch(
      connectionAdded({
        from: { ref: pendingFrom.ref, id: pendingFrom.id, port: pendingFrom.port },
        to: { ref: 'placement', id: placement.id, port },
        transportId: defaultTransportId,
      }),
    )
  }

  const baseStyle: CSSProperties = {
    position: 'absolute',
    left: placement.x * pxPerMeter,
    opacity: isDragging ? 0.4 : 1,
  }

  // No overflow-hidden: ports straddle the box edge and must not be clipped
  // (the rounded corners still clip the background fill via border-radius).
  const sharedClass =
    'group/wb absolute cursor-grab touch-none active:cursor-grabbing'
  // Overlap warning (red) takes priority over the selection ring (ficsit).
  const ring = overlapping
    ? ' ring-2 ring-red-500'
    : selected
      ? ' ring-2 ring-ficsit'
      : ''

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation()
        dispatch(placementSelected(placement.id))
      }}
      style={
        box
          ? {
              ...baseStyle,
              bottom: 0,
              width,
              height: Math.max(MIN_BLOCK_PX, box.height * pxPerMeter),
              borderColor: box.color,
              backgroundColor: `${box.color}33`,
            }
          : { ...baseStyle, top: 0, bottom: 0, width }
      }
      className={
        box
          ? `${sharedClass} rounded-sm border-2${ring}`
          : `${sharedClass} rounded-sm border-2 border-dashed border-gray-600 bg-gray-500/10${ring}`
      }
      title={
        box
          ? `${box.name || (isExtractor ? 'Extractor' : 'Workbench')} — ${box.width}×${box.height} m ·×${placement.quantity}${subLabel ? ` · ${subLabel}` : ''}`
          : `${spacer?.name || 'Spacer'} — ${def.width} m gap`
      }
      {...attributes}
      {...listeners}
    >
      {box ? (
        <div className="pointer-events-none absolute inset-x-1 top-0.5 flex flex-col leading-tight">
          <span className="truncate text-[10px] font-medium text-gray-100">
            {box.name}
          </span>
          {subLabel && (
            <span className="truncate text-[9px] font-medium text-ficsit">
              {isExtractor ? `${subLabel} · Mk${placement.tier}` : subLabel}
            </span>
          )}
        </div>
      ) : (
        <span className="pointer-events-none flex h-full items-center justify-center px-1 text-[10px] font-medium text-gray-400">
          {`${def.width}m`}
        </span>
      )}
      {showPorts &&
        portDescs.map((p) => {
          const wrap: CSSProperties = {
            ...portPosStyle(p.pos),
            zIndex: 30,
          }
          // Empty slot: faded, non-interactive marker (no recipe item here).
          if (!p.refId)
            return (
              <span key={`${p.type}-${p.index}`} style={wrap}>
                <span
                  style={portStyle}
                  className="block rounded-full bg-gray-600/40 ring-1 ring-gray-500/40"
                />
              </span>
            )
          if (p.type === 'in') {
            const valid =
              pendingFrom != null &&
              !(
                pendingFrom.ref === 'placement' &&
                pendingFrom.id === placement.id
              ) &&
              (pendingFrom.refId === null || pendingFrom.refId === p.refId)
            return (
              <span key={`in-${p.index}`} style={wrap}>
                <button
                  type="button"
                  data-port={`${placement.id}::in::${p.index}`}
                  aria-label="Input port"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    completeTo(p.index, p.refId as string)
                  }}
                  style={portStyle}
                  className={`block bg-sky-400 ${portBase} ${valid ? 'scale-125 ring-2 ring-emerald-400' : 'ring-sky-200/50'}`}
                />
              </span>
            )
          }
          const isSrc =
            pendingFrom?.ref === 'placement' &&
            pendingFrom.id === placement.id &&
            pendingFrom.port === p.index
          return (
            <span key={`out-${p.index}`} style={wrap}>
              <button
                type="button"
                data-port={`${placement.id}::out::${p.index}`}
                aria-label="Output port"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  pickSource(p.index, p.refId as string)
                }}
                style={portStyle}
                className={`block bg-ficsit ${portBase} ${isSrc ? 'scale-125 ring-2 ring-ficsit' : 'ring-ficsit/50'}`}
              />
            </span>
          )
        })}
      {box && (
        <span className="pointer-events-none absolute bottom-0.5 left-1 font-mono text-[10px] font-semibold text-ficsit">
          ×{placement.quantity}
        </span>
      )}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          dispatch(placementRemoved(placement.id))
        }}
        title="Remove"
        aria-label="Remove"
        className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center
          rounded bg-surface-0/70 text-[10px] text-gray-300 opacity-0 transition
          hover:bg-red-500/40 hover:text-red-200 group-hover/wb:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}
