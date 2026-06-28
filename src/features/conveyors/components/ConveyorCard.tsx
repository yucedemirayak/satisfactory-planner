import { useAppDispatch } from '@/app/hooks'

import { MAX_CONVEYOR_RATE, MIN_CONVEYOR_RATE } from '../constants'
import { conveyorRemoved, conveyorUpdated } from '../conveyorsSlice'
import { conveyorLabel } from '../helpers'
import type { Conveyor } from '../types'

interface ConveyorCardProps {
  conveyor: Conveyor
  index: number
}

/** A created conveyor tier with inline-editable name and max throughput. */
export function ConveyorCard({ conveyor, index }: ConveyorCardProps) {
  const dispatch = useAppDispatch()
  const update = (changes: Parameters<typeof conveyorUpdated>[0]['changes']) =>
    dispatch(conveyorUpdated({ id: conveyor.id, changes }))

  return (
    <div className="flex items-center gap-3 rounded-lg border border-edge bg-surface-1 p-3">
      <input
        type="text"
        value={conveyor.name}
        placeholder={conveyorLabel(conveyor, index)}
        onChange={(e) => update({ name: e.target.value })}
        className="min-w-0 flex-1 rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
      />
      <label className="flex shrink-0 items-center gap-1.5">
        <input
          type="number"
          min={MIN_CONVEYOR_RATE}
          max={MAX_CONVEYOR_RATE}
          step="any"
          value={conveyor.maxRate}
          onChange={(e) => update({ maxRate: Number(e.target.value) })}
          className="w-24 rounded-md border border-edge bg-surface-0 px-2 py-1 text-right font-mono text-sm text-gray-100 outline-none focus:border-ficsit"
          aria-label="Max rate per minute"
        />
        <span className="text-xs text-gray-500">/min</span>
      </label>
      <button
        type="button"
        onClick={() => dispatch(conveyorRemoved(conveyor.id))}
        className="shrink-0 rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
      >
        Delete
      </button>
    </div>
  )
}
