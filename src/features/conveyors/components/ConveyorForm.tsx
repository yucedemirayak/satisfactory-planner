import { useState } from 'react'

import { useAppDispatch } from '@/app/hooks'

import {
  DEFAULT_CONVEYOR_RATE,
  MAX_CONVEYOR_RATE,
  MIN_CONVEYOR_RATE,
} from '../constants'
import { conveyorAdded } from '../conveyorsSlice'

const inputClass =
  'rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit'

/** Form to create a new conveyor tier (name + max throughput). */
export function ConveyorForm() {
  const dispatch = useAppDispatch()
  const [name, setName] = useState('')
  const [maxRate, setMaxRate] = useState(DEFAULT_CONVEYOR_RATE)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(conveyorAdded({ name, maxRate }))
    setName('')
    setMaxRate(DEFAULT_CONVEYOR_RATE)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4"
    >
      <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
        New Conveyor
      </h2>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Name</span>
        <input
          type="text"
          value={name}
          placeholder="e.g. Conveyor Mk.1"
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Max rate /min</span>
        <input
          type="number"
          min={MIN_CONVEYOR_RATE}
          max={MAX_CONVEYOR_RATE}
          step="any"
          value={maxRate}
          onChange={(e) => setMaxRate(Number(e.target.value))}
          className={`${inputClass} font-mono`}
        />
      </label>

      <button
        type="submit"
        className="self-end rounded-md bg-ficsit px-4 py-2 text-sm font-semibold text-surface-0 transition hover:bg-ficsit-dark"
      >
        + Add Conveyor
      </button>
    </form>
  )
}
