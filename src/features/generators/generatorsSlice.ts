import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import type { PortPos } from '@/features/ports'

import {
  MAX_FUEL_RATE,
  MAX_GENERATOR_DIM,
  MAX_GENERATOR_POWER,
  MIN_FUEL_RATE,
  MIN_GENERATOR_DIM,
  MIN_GENERATOR_POWER,
} from './constants'
import { generatorPortCounts } from './helpers'
import type { Generator, GeneratorDraft, GeneratorFuel } from './types'

export interface GeneratorsState {
  items: Generator[]
}

const initialState: GeneratorsState = {
  items: [],
}

// Dimensions allow decimals (real footprints, e.g. Water Extractor 19.5 m).
const clampDim = (v: number): number =>
  Number.isFinite(v)
    ? Math.min(MAX_GENERATOR_DIM, Math.max(MIN_GENERATOR_DIM, v))
    : MIN_GENERATOR_DIM

const clampPower = (v: number): number =>
  Number.isFinite(v)
    ? Math.min(MAX_GENERATOR_POWER, Math.max(MIN_GENERATOR_POWER, v))
    : 0

const clampRate = (v: number): number =>
  Number.isFinite(v) ? Math.min(MAX_FUEL_RATE, Math.max(MIN_FUEL_RATE, v)) : 0

const sanitizeFuel = (f: GeneratorFuel): GeneratorFuel => ({
  refId: f.refId,
  rate: clampRate(f.rate),
  byproduct: f.byproduct
    ? { refId: f.byproduct.refId, rate: clampRate(f.byproduct.rate) }
    : null,
})

const sanitize = (g: Generator): Generator => ({
  ...g,
  width: clampDim(g.width),
  depth: clampDim(g.depth),
  height: clampDim(g.height),
  powerOutput: clampPower(g.powerOutput),
  water: g.water ? { refId: g.water.refId, rate: clampRate(g.water.rate) } : null,
  fuels: g.fuels.map(sanitizeFuel),
})

const generatorsSlice = createSlice({
  name: 'generators',
  initialState,
  reducers: {
    generatorAdded: {
      reducer(state, action: PayloadAction<Generator>) {
        state.items.push(sanitize(action.payload))
      },
      prepare(draft: GeneratorDraft) {
        return { payload: { id: nanoid(), ...draft } }
      },
    },
    generatorUpdated(
      state,
      action: PayloadAction<{ id: string; changes: Partial<GeneratorDraft> }>,
    ) {
      const g = state.items.find((x) => x.id === action.payload.id)
      if (!g) return
      const { changes } = action.payload
      if (changes.name !== undefined) g.name = changes.name
      if (changes.color !== undefined) g.color = changes.color
      if (changes.width !== undefined) g.width = clampDim(changes.width)
      if (changes.depth !== undefined) g.depth = clampDim(changes.depth)
      if (changes.height !== undefined) g.height = clampDim(changes.height)
      if (changes.powerOutput !== undefined)
        g.powerOutput = clampPower(changes.powerOutput)
      if (changes.water !== undefined)
        g.water = changes.water
          ? { refId: changes.water.refId, rate: clampRate(changes.water.rate) }
          : null
      if (changes.fuels !== undefined) g.fuels = changes.fuels.map(sanitizeFuel)
    },
    generatorRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x.id !== action.payload)
    },
    /** Move one input/output port to a position on the box face. */
    generatorPortPosChanged(
      state,
      action: PayloadAction<{
        id: string
        side: 'in' | 'out'
        index: number
        pos: PortPos
      }>,
    ) {
      const g = state.items.find((x) => x.id === action.payload.id)
      if (!g) return
      const { side, index, pos } = action.payload
      const counts = generatorPortCounts(g)
      const count = side === 'in' ? counts.inputs : counts.outputs
      if (index < 0 || index >= count) return
      const fx = side === 'in' ? 0 : 1
      const stored = side === 'in' ? g.inputPorts : g.outputPorts
      // Build a full-length list (default edge column) so shorter arrays grow.
      const list = Array.from(
        { length: count },
        (_, i) => stored?.[i] ?? { fx, fy: (i + 1) / (count + 1) },
      )
      list[index] = pos
      if (side === 'in') g.inputPorts = list
      else g.outputPorts = list
    },
  },
})

export const {
  generatorAdded,
  generatorUpdated,
  generatorRemoved,
  generatorPortPosChanged,
} = generatorsSlice.actions

export default generatorsSlice.reducer
