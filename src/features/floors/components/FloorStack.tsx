import type { ReactNode } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'

import { floorAdded, floorSelected } from '../floorsSlice'
import { floorLabel } from '../helpers'
import { selectFloors, selectSelectedFloorId } from '../selectors'
import type { Floor } from '../types'
import { AddFloorButton } from './AddFloorButton'
import { FloorBand } from './FloorBand'
import { FloorInsertZone } from './FloorInsertZone'

interface FloorStackProps {
  /** Optional per-floor content layer (e.g. a placements drop area). */
  renderFloorContent?: (floor: Floor) => ReactNode
}

/**
 * The interactive 2D side-elevation of the factory: floors stacked bottom→top,
 * rendered top→bottom on screen. Top/bottom adds use always-visible buttons;
 * inserting between floors uses the thin zones between bands.
 */
export function FloorStack({ renderFloorContent }: FloorStackProps = {}) {
  const dispatch = useAppDispatch()
  const floors = useAppSelector(selectFloors)
  const selectedId = useAppSelector(selectSelectedFloorId)

  if (floors.length === 0) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-4
          rounded-lg border border-dashed border-edge bg-surface-1/50 p-10
          text-center"
      >
        <p className="text-gray-400">No floors yet.</p>
        <button
          type="button"
          onClick={() => dispatch(floorAdded({ kind: 'bottom' }))}
          className="rounded-md bg-ficsit px-4 py-2 font-semibold text-surface-0
            transition hover:bg-ficsit-dark"
        >
          + Add Floor
        </button>
      </div>
    )
  }

  // Render top→bottom: reverse a copy of the bottom→top array.
  const rendered = floors.map((floor, i) => ({ floor, indexFromBottom: i }))
  rendered.reverse()
  const lastIndex = rendered.length - 1

  return (
    // w-max sizes the stack to the widest floor; min-w-full keeps it ≥ viewport,
    // so every band stretches to the widest and the whole plan scrolls as one.
    <div className="flex w-max min-w-full flex-col gap-1.5">
      <AddFloorButton
        title="Add floor on top"
        onClick={() => dispatch(floorAdded({ kind: 'top' }))}
      />

      {rendered.map(({ floor, indexFromBottom }, i) => (
        <div key={floor.id} className="flex flex-col gap-1.5">
          <FloorBand
            floor={floor}
            label={floorLabel(floor, indexFromBottom)}
            selected={floor.id === selectedId}
            onSelect={() => dispatch(floorSelected(floor.id))}
          >
            {renderFloorContent?.(floor)}
          </FloorBand>
          {/* insert zone only *between* floors; ends use the buttons */}
          {i < lastIndex && (
            <FloorInsertZone
              title="Insert floor here"
              onAdd={() =>
                dispatch(floorAdded({ kind: 'at', index: indexFromBottom }))
              }
            />
          )}
        </div>
      ))}

      <AddFloorButton
        title="Add floor on bottom"
        onClick={() => dispatch(floorAdded({ kind: 'bottom' }))}
      />
    </div>
  )
}
