import { useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { WorkbenchPreview } from '@/features/workbenches'

import {
  DEFAULT_EXTRACTOR_BASE_RATE,
  DEFAULT_EXTRACTOR_DEPTH,
  DEFAULT_EXTRACTOR_HEIGHT,
  DEFAULT_EXTRACTOR_WIDTH,
  EXTRACTOR_PALETTE,
  MAX_EXTRACTOR_BASE_RATE,
  MAX_EXTRACTOR_DIM,
  MIN_EXTRACTOR_BASE_RATE,
  MIN_EXTRACTOR_DIM,
} from '../constants'
import { extractorAdded } from '../extractorsSlice'
import { selectNextExtractorColor } from '../selectors'

const inputClass =
  'rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit'

/** Form to create a new extractor (footprint, base rate, colour). */
export function ExtractorForm() {
  const dispatch = useAppDispatch()
  const nextColor = useAppSelector(selectNextExtractorColor)

  const [name, setName] = useState('')
  const [width, setWidth] = useState(DEFAULT_EXTRACTOR_WIDTH)
  const [depth, setDepth] = useState(DEFAULT_EXTRACTOR_DEPTH)
  const [height, setHeight] = useState(DEFAULT_EXTRACTOR_HEIGHT)
  const [baseRate, setBaseRate] = useState(DEFAULT_EXTRACTOR_BASE_RATE)
  const [color, setColor] = useState<string>(nextColor)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(extractorAdded({ name, width, depth, height, baseRate, color }))
    setName('')
    setWidth(DEFAULT_EXTRACTOR_WIDTH)
    setDepth(DEFAULT_EXTRACTOR_DEPTH)
    setHeight(DEFAULT_EXTRACTOR_HEIGHT)
    setBaseRate(DEFAULT_EXTRACTOR_BASE_RATE)
    const next =
      EXTRACTOR_PALETTE[
        (EXTRACTOR_PALETTE.indexOf(color as (typeof EXTRACTOR_PALETTE)[number]) +
          1) %
          EXTRACTOR_PALETTE.length
      ]
    setColor(next)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4"
    >
      <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
        New Extractor
      </h2>

      <div className="flex items-center gap-4">
        <WorkbenchPreview width={width} height={height} color={color} boxPx={72} />
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Name</span>
          <input
            type="text"
            value={name}
            placeholder="e.g. Miner"
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Width (m)</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_DIM}
            max={MAX_EXTRACTOR_DIM}
            step="any"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className={`${inputClass} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Depth (m)</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_DIM}
            max={MAX_EXTRACTOR_DIM}
            step="any"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className={`${inputClass} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Height (m)</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_DIM}
            max={MAX_EXTRACTOR_DIM}
            step="any"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className={`${inputClass} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Rate /min</span>
          <input
            type="number"
            min={MIN_EXTRACTOR_BASE_RATE}
            max={MAX_EXTRACTOR_BASE_RATE}
            step="any"
            value={baseRate}
            onChange={(e) => setBaseRate(Number(e.target.value))}
            className={`${inputClass} font-mono`}
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Color</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="size-8 cursor-pointer rounded border border-edge bg-surface-0"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-ficsit px-4 py-2 text-sm font-semibold text-surface-0 transition hover:bg-ficsit-dark"
        >
          + Add Extractor
        </button>
      </div>
    </form>
  )
}
