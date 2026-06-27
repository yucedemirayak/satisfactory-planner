import { useAppDispatch } from '@/app/hooks'
import { WorkbenchPreview } from '@/features/workbenches'

import {
  MAX_EXTRACTOR_BASE_RATE,
  MAX_EXTRACTOR_DIM,
  MIN_EXTRACTOR_BASE_RATE,
  MIN_EXTRACTOR_DIM,
} from '../constants'
import { extractorRemoved, extractorUpdated } from '../extractorsSlice'
import { extractorLabel } from '../helpers'
import type { Extractor } from '../types'

interface ExtractorCardProps {
  extractor: Extractor
  index: number
}

const dimInput =
  'w-full rounded-md border border-edge bg-surface-0 px-2 py-1 text-center font-mono text-sm text-gray-100 outline-none focus:border-ficsit'

/** A created extractor with inline-editable footprint, base rate and colour. */
export function ExtractorCard({ extractor, index }: ExtractorCardProps) {
  const dispatch = useAppDispatch()
  const update = (changes: Parameters<typeof extractorUpdated>[0]['changes']) =>
    dispatch(extractorUpdated({ id: extractor.id, changes }))

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-edge bg-surface-1 p-3">
      <div className="flex items-start gap-3">
        <WorkbenchPreview
          width={extractor.width}
          height={extractor.height}
          color={extractor.color}
          boxPx={72}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            type="text"
            value={extractor.name}
            placeholder={extractorLabel(extractor, index)}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={extractor.color}
              onChange={(e) => update({ color: e.target.value })}
              className="size-7 shrink-0 cursor-pointer rounded border border-edge bg-surface-0"
              aria-label="Color"
            />
            <button
              type="button"
              onClick={() => dispatch(extractorRemoved(extractor.id))}
              className="ml-auto rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Width (m)</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_DIM}
            max={MAX_EXTRACTOR_DIM}
            value={extractor.width}
            onChange={(e) => update({ width: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Height (m)</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_DIM}
            max={MAX_EXTRACTOR_DIM}
            value={extractor.height}
            onChange={(e) => update({ height: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Rate /min</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_BASE_RATE}
            max={MAX_EXTRACTOR_BASE_RATE}
            step="any"
            value={extractor.baseRate}
            onChange={(e) => update({ baseRate: Number(e.target.value) })}
            className={dimInput}
          />
        </label>
      </div>
    </div>
  )
}
