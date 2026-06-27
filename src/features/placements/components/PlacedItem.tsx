import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectPxPerMeter } from '@/features/floors/selectors'

import type { PlacementDragData } from '../dnd'
import { placementRemoved, placementSelected } from '../placementsSlice'
import { selectSelectedPlacementId } from '../selectors'
import type { Placement } from '../types'

interface PlacedItemProps {
  placement: Placement
  floorId: string
  /** Animated empty space opened before this block (px) to preview a drop. */
  gapBefore?: number
}

export const MIN_BLOCK_PX = 20

/**
 * An item sitting on a floor — a workbench / extractor (coloured block) or a
 * spacer (dashed full-height gap). Draggable to reorder / move; click to select.
 */
export function PlacedItem({
  placement,
  floorId,
  gapBefore = 0,
}: PlacedItemProps) {
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
  const pxPerMeter = useAppSelector(selectPxPerMeter)

  const data: PlacementDragData = {
    type: 'placement',
    floorId,
    kind: placement.kind,
    refId: placement.refId,
  }
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: placement.id, data })

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

  const baseStyle = {
    transform: CSS.Translate.toString(transform),
    transition: [transition, 'margin-left 160ms ease'].filter(Boolean).join(', '),
    marginLeft: gapBefore,
    width,
    opacity: isDragging ? 0.4 : 1,
  }

  const sharedClass =
    'group/wb relative shrink-0 cursor-grab touch-none overflow-hidden active:cursor-grabbing'
  const ring = selected ? ' ring-2 ring-ficsit' : ''

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
              height: Math.max(MIN_BLOCK_PX, box.height * pxPerMeter),
              borderColor: box.color,
              backgroundColor: `${box.color}33`,
            }
          : baseStyle
      }
      className={
        box
          ? `${sharedClass} self-end rounded-sm border-2${ring}`
          : `${sharedClass} h-full self-stretch rounded-sm border-2 border-dashed border-gray-600 bg-gray-500/10${ring}`
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
