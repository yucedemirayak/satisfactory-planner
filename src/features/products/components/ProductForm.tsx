import { useState } from 'react'

import { useAppDispatch } from '@/app/hooks'
import { PhaseSelect, type ItemPhase } from '@/features/materials'

import { productAdded } from '../productsSlice'

/** Form to create a new product (name + phase). */
export function ProductForm() {
  const dispatch = useAppDispatch()
  const [name, setName] = useState('')
  const [phase, setPhase] = useState<ItemPhase>('solid')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    dispatch(productAdded({ name: trimmed, phase }))
    setName('')
    setPhase('solid')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4"
    >
      <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
        New Product
      </h2>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Name</span>
        <input
          type="text"
          value={name}
          placeholder="e.g. Reinforced Iron Plate"
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Phase</span>
        <PhaseSelect value={phase} onChange={setPhase} />
      </label>

      <button
        type="submit"
        disabled={!name.trim()}
        className="self-end rounded-md bg-ficsit px-4 py-2 text-sm font-semibold text-surface-0 transition hover:bg-ficsit-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        + Add Product
      </button>
    </form>
  )
}
