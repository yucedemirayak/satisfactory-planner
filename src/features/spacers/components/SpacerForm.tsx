import { useState } from 'react'

import { useAppDispatch } from '@/app/hooks'

import {
  DEFAULT_SPACER_WIDTH,
  MAX_SPACER_WIDTH,
  MIN_SPACER_WIDTH,
} from '../constants'
import { spacerAdded } from '../spacersSlice'

const inputClass =
  'rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit'

/** Form to create a new spacer by choosing its name and width. */
export function SpacerForm() {
  const dispatch = useAppDispatch()
  const [name, setName] = useState('')
  const [width, setWidth] = useState(DEFAULT_SPACER_WIDTH)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(spacerAdded({ name, width }))
    setName('')
    setWidth(DEFAULT_SPACER_WIDTH)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4"
    >
      <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
        New Spacer
      </h2>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Name</span>
        <input
          type="text"
          value={name}
          placeholder="e.g. Walkway"
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Width (m)</span>
        <input
          type="number"
          min={MIN_SPACER_WIDTH}
          max={MAX_SPACER_WIDTH}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className={`${inputClass} font-mono`}
        />
      </label>

      <button
        type="submit"
        className="self-end rounded-md bg-ficsit px-4 py-2 text-sm font-semibold text-surface-0 transition hover:bg-ficsit-dark"
      >
        + Add Spacer
      </button>
    </form>
  )
}
