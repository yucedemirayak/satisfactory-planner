import { useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { extractorLabel, selectExtractors } from '@/features/extractors'

import { materialAdded } from '../materialsSlice'

/** Form to create a new raw material (name + the extractor that mines it). */
export function MaterialForm() {
  const dispatch = useAppDispatch()
  const extractors = useAppSelector(selectExtractors)
  const [name, setName] = useState('')
  const [extractorId, setExtractorId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    dispatch(materialAdded({ name: trimmed, extractorId: extractorId || null }))
    setName('')
    setExtractorId('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4"
    >
      <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
        New Material
      </h2>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Name</span>
        <input
          type="text"
          value={name}
          placeholder="e.g. Iron Ore"
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">
          Extracted by
        </span>
        <select
          value={extractorId}
          onChange={(e) => setExtractorId(e.target.value)}
          className="rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
        >
          <option value="">Any extractor</option>
          {extractors.map((ex, i) => (
            <option key={ex.id} value={ex.id}>
              {extractorLabel(ex, i)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={!name.trim()}
        className="self-end rounded-md bg-ficsit px-4 py-2 text-sm font-semibold text-surface-0 transition hover:bg-ficsit-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        + Add Material
      </button>
    </form>
  )
}
