import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  GRID_SIZE_OPTIONS,
  MAX_PORT_SCALE,
  MIN_PORT_SCALE,
  PORT_SCALE_STEP,
} from '@/features/floors/constants'

import {
  EDITOR_ZOOM_STEP,
  MAX_EDITOR_ZOOM,
  MIN_EDITOR_ZOOM,
} from '../constants'
import {
  portEditorChanged,
  type PortEditorPage,
  type PortEditorSettings,
} from '../portEditorSlice'

/**
 * Ports / Grid / Zoom sliders for one page's port-layout editors. Each page
 * (Workbenches, Extractors, Routing) has its own settings — changing them here
 * never affects the floor plan or the other pages.
 */
export function PortEditorToolbar({ page }: { page: PortEditorPage }) {
  const dispatch = useAppDispatch()
  const settings = useAppSelector((s) => s.portEditor[page])
  const set = (changes: Partial<PortEditorSettings>) =>
    dispatch(portEditorChanged({ page, changes }))

  // The grid presets double (0.1→8), so the slider steps over their indices —
  // each notch is one meaningful grid size (same trick as the floor toolbar).
  const gridIndex = GRID_SIZE_OPTIONS.reduce(
    (best, opt, i) =>
      Math.abs(opt - settings.gridSize) <
      Math.abs(GRID_SIZE_OPTIONS[best] - settings.gridSize)
        ? i
        : best,
    0,
  )

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Ports</span>
        <input
          type="range"
          min={MIN_PORT_SCALE}
          max={MAX_PORT_SCALE}
          step={PORT_SCALE_STEP}
          value={settings.portScale}
          onChange={(e) => set({ portScale: Number(e.target.value) })}
          aria-label="Port dot size (pixels)"
          className="w-20 accent-ficsit"
        />
        <span className="w-10 text-right font-mono text-xs text-ficsit">
          {settings.portScale} px
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Grid</span>
        <input
          type="range"
          min={0}
          max={GRID_SIZE_OPTIONS.length - 1}
          step={1}
          value={gridIndex}
          onChange={(e) =>
            set({ gridSize: GRID_SIZE_OPTIONS[Number(e.target.value)] })
          }
          aria-label="Editor grid size (metres)"
          className="w-20 accent-ficsit"
        />
        <span className="w-12 text-right font-mono text-xs text-ficsit">
          {settings.gridSize} m
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Zoom</span>
        <input
          type="range"
          min={MIN_EDITOR_ZOOM}
          max={MAX_EDITOR_ZOOM}
          step={EDITOR_ZOOM_STEP}
          value={settings.zoom}
          onChange={(e) => set({ zoom: Number(e.target.value) })}
          aria-label="Editor magnification"
          className="w-20 accent-ficsit"
        />
        <span className="w-10 text-right font-mono text-xs text-ficsit">
          {settings.zoom}×
        </span>
      </div>
    </div>
  )
}
