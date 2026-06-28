import { useAppDispatch, useAppSelector } from '@/app/hooks'

import { GRID_SIZE_OPTIONS } from '../constants'
import { gridSizeChanged } from '../floorsSlice'
import { selectGridSize } from '../selectors'

/** Snap-resolution control for the floor-plan grid (metres per cell). */
export function FloorGridControl() {
  const dispatch = useAppDispatch()
  const gridSize = useAppSelector(selectGridSize)

  return (
    <label className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Grid</span>
      <select
        value={gridSize}
        onChange={(e) => dispatch(gridSizeChanged(Number(e.target.value)))}
        aria-label="Grid snap size (metres)"
        className="rounded-md border border-edge bg-surface-0 px-2 py-1 text-xs text-gray-100 outline-none focus:border-ficsit"
      >
        {GRID_SIZE_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {m} m
          </option>
        ))}
      </select>
    </label>
  )
}
