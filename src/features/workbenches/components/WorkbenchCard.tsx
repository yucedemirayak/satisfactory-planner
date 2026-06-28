import { useAppDispatch } from '@/app/hooks'

import {
  MAX_WORKBENCH_DIM,
  MAX_WORKBENCH_SLOOP_SLOTS,
  MIN_WORKBENCH_DIM,
  MIN_WORKBENCH_SLOOP_SLOTS,
} from '../constants'
import { workbenchLabel } from '../helpers'
import type { Workbench } from '../types'
import { workbenchRemoved, workbenchUpdated } from '../workbenchesSlice'
import { WorkbenchPreview } from './WorkbenchPreview'

interface WorkbenchCardProps {
  workbench: Workbench
  index: number
}

const dimInputClass =
  'w-full rounded-md border border-edge bg-surface-0 px-2 py-1 text-center font-mono text-sm text-gray-100 outline-none focus:border-ficsit'

/** A created workbench with inline-editable name, size and colour. */
export function WorkbenchCard({ workbench, index }: WorkbenchCardProps) {
  const dispatch = useAppDispatch()
  const update = (changes: Parameters<typeof workbenchUpdated>[0]['changes']) =>
    dispatch(workbenchUpdated({ id: workbench.id, changes }))

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-edge bg-surface-1 p-3">
      <div className="flex items-start gap-3">
        <WorkbenchPreview
          width={workbench.width}
          height={workbench.height}
          color={workbench.color}
          boxPx={72}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            type="text"
            value={workbench.name}
            placeholder={workbenchLabel(workbench, index)}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={workbench.color}
              onChange={(e) => update({ color: e.target.value })}
              className="size-7 shrink-0 cursor-pointer rounded border border-edge bg-surface-0"
              aria-label="Color"
            />
            <button
              type="button"
              onClick={() => dispatch(workbenchRemoved(workbench.id))}
              className="ml-auto rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Width (m)</span>
          <input
            type="number"
            min={MIN_WORKBENCH_DIM}
            max={MAX_WORKBENCH_DIM}
            step="any"
            value={workbench.width}
            onChange={(e) => update({ width: Number(e.target.value) })}
            className={dimInputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Depth (m)</span>
          <input
            type="number"
            min={MIN_WORKBENCH_DIM}
            max={MAX_WORKBENCH_DIM}
            step="any"
            value={workbench.depth}
            onChange={(e) => update({ depth: Number(e.target.value) })}
            className={dimInputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Height (m)</span>
          <input
            type="number"
            min={MIN_WORKBENCH_DIM}
            max={MAX_WORKBENCH_DIM}
            step="any"
            value={workbench.height}
            onChange={(e) => update({ height: Number(e.target.value) })}
            className={dimInputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Sloop slots</span>
          <input
            type="number"
            min={MIN_WORKBENCH_SLOOP_SLOTS}
            max={MAX_WORKBENCH_SLOOP_SLOTS}
            value={workbench.sloopSlots}
            onChange={(e) => update({ sloopSlots: Number(e.target.value) })}
            className={dimInputClass}
          />
        </label>
      </div>
    </div>
  )
}
