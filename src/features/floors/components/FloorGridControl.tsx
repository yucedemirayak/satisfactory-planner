import { useAppDispatch, useAppSelector } from '@/app/hooks'

import { GRID_SIZE_OPTIONS } from '../constants'
import { gridSizeChanged } from '../floorsSlice'
import { selectGridSize } from '../selectors'

/** Snap-resolution control for the floor-plan grid (metres per cell). */
export function FloorGridControl() {
  const dispatch = useAppDispatch()
  const gridSize = useAppSelector(selectGridSize)

  // The presets double (0.25→8), so the slider steps over their indices rather
  // than metres — each notch is one meaningful grid size, like the other sliders.
  const index = GRID_SIZE_OPTIONS.reduce(
    (best, opt, i) =>
      Math.abs(opt - gridSize) < Math.abs(GRID_SIZE_OPTIONS[best] - gridSize)
        ? i
        : best,
    0,
  )

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Grid</span>
      <input
        type="range"
        min={0}
        max={GRID_SIZE_OPTIONS.length - 1}
        step={1}
        value={index}
        onChange={(e) =>
          dispatch(gridSizeChanged(GRID_SIZE_OPTIONS[Number(e.target.value)]))
        }
        aria-label="Grid snap size (metres)"
        className="w-20 accent-ficsit"
      />
      <span className="w-12 text-right font-mono text-xs text-ficsit">
        {gridSize} m
      </span>
    </div>
  )
}
