import { useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'

import {
  DEFAULT_WORKBENCH_HEIGHT,
  DEFAULT_WORKBENCH_SLOOP_SLOTS,
  DEFAULT_WORKBENCH_WIDTH,
  MAX_WORKBENCH_DIM,
  MAX_WORKBENCH_SLOOP_SLOTS,
  MIN_WORKBENCH_DIM,
  MIN_WORKBENCH_SLOOP_SLOTS,
  WORKBENCH_PALETTE,
} from '../constants'
import { selectNextWorkbenchColor } from '../selectors'
import { workbenchAdded } from '../workbenchesSlice'
import { WorkbenchPreview } from './WorkbenchPreview'

const inputClass =
  'rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit'

/** Form to create a new workbench by choosing its name, size and colour. */
export function WorkbenchForm() {
  const dispatch = useAppDispatch()
  const nextColor = useAppSelector(selectNextWorkbenchColor)

  const [name, setName] = useState('')
  const [width, setWidth] = useState(DEFAULT_WORKBENCH_WIDTH)
  const [height, setHeight] = useState(DEFAULT_WORKBENCH_HEIGHT)
  const [sloopSlots, setSloopSlots] = useState(DEFAULT_WORKBENCH_SLOOP_SLOTS)
  const [color, setColor] = useState<string>(nextColor)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(workbenchAdded({ name, width, height, sloopSlots, color }))
    setName('')
    setWidth(DEFAULT_WORKBENCH_WIDTH)
    setHeight(DEFAULT_WORKBENCH_HEIGHT)
    setSloopSlots(DEFAULT_WORKBENCH_SLOOP_SLOTS)
    const next =
      WORKBENCH_PALETTE[
        (WORKBENCH_PALETTE.indexOf(color as (typeof WORKBENCH_PALETTE)[number]) +
          1) %
          WORKBENCH_PALETTE.length
      ]
    setColor(next)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4"
    >
      <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
        New Workbench
      </h2>

      <div className="flex items-center gap-4">
        <WorkbenchPreview width={width} height={height} color={color} boxPx={72} />
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Name</span>
          <input
            type="text"
            value={name}
            placeholder="e.g. Constructor"
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Width (m)</span>
          <input
            type="number"
            min={MIN_WORKBENCH_DIM}
            max={MAX_WORKBENCH_DIM}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className={`${inputClass} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Height (m)</span>
          <input
            type="number"
            min={MIN_WORKBENCH_DIM}
            max={MAX_WORKBENCH_DIM}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className={`${inputClass} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Sloop slots</span>
          <input
            type="number"
            min={MIN_WORKBENCH_SLOOP_SLOTS}
            max={MAX_WORKBENCH_SLOOP_SLOTS}
            value={sloopSlots}
            onChange={(e) => setSloopSlots(Number(e.target.value))}
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
          + Add Workbench
        </button>
      </div>
    </form>
  )
}
