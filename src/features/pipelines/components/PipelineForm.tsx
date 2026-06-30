import { useState } from 'react'

import { useAppDispatch } from '@/app/hooks'

import {
  DEFAULT_PIPELINE_RATE,
  MAX_PIPELINE_RATE,
  MIN_PIPELINE_RATE,
} from '../constants'
import { pipelineAdded } from '../pipelinesSlice'

const inputClass =
  'rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit'

/** Form to create a new pipeline tier (name + max throughput). */
export function PipelineForm() {
  const dispatch = useAppDispatch()
  const [name, setName] = useState('')
  const [maxRate, setMaxRate] = useState(DEFAULT_PIPELINE_RATE)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(pipelineAdded({ name, maxRate }))
    setName('')
    setMaxRate(DEFAULT_PIPELINE_RATE)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4"
    >
      <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
        New Pipeline
      </h2>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Name</span>
        <input
          type="text"
          value={name}
          placeholder="e.g. Pipeline Mk.1"
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">
          Max rate (m³/min)
        </span>
        <input
          type="number"
          min={MIN_PIPELINE_RATE}
          max={MAX_PIPELINE_RATE}
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
        + Add Pipeline
      </button>
    </form>
  )
}
