import { useAppDispatch } from '@/app/hooks'

import { MAX_SPACER_WIDTH, MIN_SPACER_WIDTH } from '../constants'
import { spacerLabel } from '../helpers'
import { spacerRemoved, spacerUpdated } from '../spacersSlice'
import type { Spacer } from '../types'

interface SpacerCardProps {
  spacer: Spacer
  index: number
}

/** A created spacer with inline-editable name and width. */
export function SpacerCard({ spacer, index }: SpacerCardProps) {
  const dispatch = useAppDispatch()
  const update = (changes: Parameters<typeof spacerUpdated>[0]['changes']) =>
    dispatch(spacerUpdated({ id: spacer.id, changes }))

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-edge bg-surface-1 p-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={spacer.name}
          placeholder={spacerLabel(spacer, index)}
          onChange={(e) => update({ name: e.target.value })}
          className="min-w-0 flex-1 rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
        />
        <button
          type="button"
          onClick={() => dispatch(spacerRemoved(spacer.id))}
          className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
        >
          Delete
        </button>
      </div>

      {/* dashed bar hinting the gap */}
      <div
        className="h-6 rounded-sm border-2 border-dashed border-gray-600 bg-gray-500/5"
        aria-hidden
      />

      <label className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-400">Width (m)</span>
        <input
          type="number"
          min={MIN_SPACER_WIDTH}
          max={MAX_SPACER_WIDTH}
          value={spacer.width}
          onChange={(e) => update({ width: Number(e.target.value) })}
          className="w-20 rounded-md border border-edge bg-surface-0 px-2 py-1 text-center font-mono text-sm text-gray-100 outline-none focus:border-ficsit"
        />
      </label>
    </div>
  )
}
