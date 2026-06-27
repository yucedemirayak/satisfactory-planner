import { useAppDispatch, useAppSelector } from '@/app/hooks'

import {
  MAX_FLOOR_HEIGHT,
  MIN_FLOOR_HEIGHT,
} from '../constants'
import { floorHeightChanged, floorRemoved, floorRenamed } from '../floorsSlice'
import { floorLabel } from '../helpers'
import { selectFloors, selectSelectedFloorId } from '../selectors'

/** Right-hand panel to edit the currently selected floor. */
export function FloorInspector() {
  const dispatch = useAppDispatch()
  const floors = useAppSelector(selectFloors)
  const selectedId = useAppSelector(selectSelectedFloorId)

  const index = floors.findIndex((f) => f.id === selectedId)
  const floor = index >= 0 ? floors[index] : null

  if (!floor) {
    return (
      <aside className="rounded-lg border border-edge bg-surface-1 p-4">
        <p className="text-sm text-gray-500">Select a floor to edit.</p>
      </aside>
    )
  }

  const setHeight = (height: number) =>
    dispatch(floorHeightChanged({ id: floor.id, height }))

  return (
    <aside className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
          {floorLabel(floor, index)}
        </h2>
        <button
          type="button"
          onClick={() => dispatch(floorRemoved(floor.id))}
          className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
        >
          Delete
        </button>
      </header>

      {/* name */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Name</span>
        <input
          type="text"
          value={floor.name}
          placeholder={floorLabel(floor, index)}
          onChange={(e) =>
            dispatch(floorRenamed({ id: floor.id, name: e.target.value }))
          }
          className="rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm
            text-gray-100 outline-none focus:border-ficsit"
        />
      </label>

      {/* height */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Height</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setHeight(floor.height - 1)}
              className="flex size-6 items-center justify-center rounded border border-edge
                bg-surface-2 text-gray-300 transition hover:border-ficsit hover:text-ficsit"
              aria-label="Decrease height"
            >
              −
            </button>
            <input
              type="number"
              min={MIN_FLOOR_HEIGHT}
              max={MAX_FLOOR_HEIGHT}
              value={floor.height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-16 rounded-md border border-edge bg-surface-0 px-2 py-1 text-center
                font-mono text-sm text-gray-100 outline-none focus:border-ficsit"
            />
            <button
              type="button"
              onClick={() => setHeight(floor.height + 1)}
              className="flex size-6 items-center justify-center rounded border border-edge
                bg-surface-2 text-gray-300 transition hover:border-ficsit hover:text-ficsit"
              aria-label="Increase height"
            >
              +
            </button>
            <span className="ml-1 text-xs text-gray-500">m</span>
          </div>
        </div>
        <input
          type="range"
          min={MIN_FLOOR_HEIGHT}
          max={MAX_FLOOR_HEIGHT}
          value={floor.height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className="accent-ficsit"
        />
      </div>
    </aside>
  )
}
