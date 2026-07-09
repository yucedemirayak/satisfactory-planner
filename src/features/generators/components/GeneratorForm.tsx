import { useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { WorkbenchPreview } from '@/features/workbenches'

import {
  DEFAULT_GENERATOR_DEPTH,
  DEFAULT_GENERATOR_HEIGHT,
  DEFAULT_GENERATOR_POWER,
  DEFAULT_GENERATOR_WIDTH,
  GENERATOR_PALETTE,
  MAX_GENERATOR_DIM,
  MAX_GENERATOR_POWER,
  MIN_GENERATOR_DIM,
  MIN_GENERATOR_POWER,
} from '../constants'
import { generatorAdded } from '../generatorsSlice'
import { selectNextGeneratorColor } from '../selectors'

const inputClass =
  'rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit'

/**
 * Form to create a new generator (footprint, MW output, colour). Fuels and
 * water intake are edited afterwards on the generator's card.
 */
export function GeneratorForm() {
  const dispatch = useAppDispatch()
  const nextColor = useAppSelector(selectNextGeneratorColor)

  const [name, setName] = useState('')
  const [width, setWidth] = useState(DEFAULT_GENERATOR_WIDTH)
  const [depth, setDepth] = useState(DEFAULT_GENERATOR_DEPTH)
  const [height, setHeight] = useState(DEFAULT_GENERATOR_HEIGHT)
  const [powerOutput, setPowerOutput] = useState(DEFAULT_GENERATOR_POWER)
  const [color, setColor] = useState<string>(nextColor)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(
      generatorAdded({
        name,
        width,
        depth,
        height,
        powerOutput,
        water: null,
        fuels: [],
        color,
      }),
    )
    setName('')
    setWidth(DEFAULT_GENERATOR_WIDTH)
    setDepth(DEFAULT_GENERATOR_DEPTH)
    setHeight(DEFAULT_GENERATOR_HEIGHT)
    setPowerOutput(DEFAULT_GENERATOR_POWER)
    const next =
      GENERATOR_PALETTE[
        (GENERATOR_PALETTE.indexOf(color as (typeof GENERATOR_PALETTE)[number]) +
          1) %
          GENERATOR_PALETTE.length
      ]
    setColor(next)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4"
    >
      <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
        New Generator
      </h2>

      <div className="flex items-center gap-4">
        <WorkbenchPreview width={width} height={height} color={color} boxPx={72} />
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Name</span>
          <input
            type="text"
            value={name}
            placeholder="e.g. Coal Generator"
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
            min={MIN_GENERATOR_DIM}
            max={MAX_GENERATOR_DIM}
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
            min={MIN_GENERATOR_DIM}
            max={MAX_GENERATOR_DIM}
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
            min={MIN_GENERATOR_DIM}
            max={MAX_GENERATOR_DIM}
            step="any"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className={`${inputClass} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400">Power (MW)</span>
          <input
            type="number"
            min={MIN_GENERATOR_POWER}
            max={MAX_GENERATOR_POWER}
            step="any"
            value={powerOutput}
            onChange={(e) => setPowerOutput(Number(e.target.value))}
            className={`${inputClass} font-mono`}
          />
        </label>
      </div>

      <p className="text-xs text-gray-500">
        Add fuels (and water intake) on the card after creating. No fuels =
        geothermal-style: always on, output scaled by node purity.
      </p>

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
          + Add Generator
        </button>
      </div>
    </form>
  )
}
