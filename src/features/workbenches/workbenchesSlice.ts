import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import type { PortPos } from '@/features/ports'

import {
  MAX_WORKBENCH_DIM,
  MAX_WORKBENCH_INPUTS,
  MAX_WORKBENCH_OUTPUTS,
  MAX_WORKBENCH_POWER,
  MAX_WORKBENCH_SLOOP_SLOTS,
  MIN_WORKBENCH_DIM,
  MIN_WORKBENCH_PORTS,
  MIN_WORKBENCH_POWER,
  MIN_WORKBENCH_SLOOP_SLOTS,
} from './constants'
import type { Workbench, WorkbenchDraft } from './types'

export interface WorkbenchesState {
  items: Workbench[]
}

const initialState: WorkbenchesState = {
  items: [],
}

// Dimensions allow decimals (real building footprints, e.g. 9.9 m).
const clampDim = (value: number): number =>
  Number.isFinite(value)
    ? Math.min(MAX_WORKBENCH_DIM, Math.max(MIN_WORKBENCH_DIM, value))
    : MIN_WORKBENCH_DIM

const clampSloopSlots = (value: number): number =>
  Math.min(
    MAX_WORKBENCH_SLOOP_SLOTS,
    Math.max(MIN_WORKBENCH_SLOOP_SLOTS, Math.round(value)),
  )

const clampPorts = (value: number, max: number): number =>
  Number.isFinite(value)
    ? Math.min(max, Math.max(MIN_WORKBENCH_PORTS, Math.round(value)))
    : MIN_WORKBENCH_PORTS

const clampPower = (value: number): number =>
  Number.isFinite(value)
    ? Math.min(MAX_WORKBENCH_POWER, Math.max(MIN_WORKBENCH_POWER, value))
    : 0

const workbenchesSlice = createSlice({
  name: 'workbenches',
  initialState,
  reducers: {
    workbenchAdded: {
      reducer(state, action: PayloadAction<Workbench>) {
        const wb = action.payload
        state.items.push({
          ...wb,
          width: clampDim(wb.width),
          depth: clampDim(wb.depth),
          height: clampDim(wb.height),
          sloopSlots: clampSloopSlots(wb.sloopSlots),
          powerUsage: clampPower(wb.powerUsage),
          inputs: clampPorts(wb.inputs, MAX_WORKBENCH_INPUTS),
          outputs: clampPorts(wb.outputs, MAX_WORKBENCH_OUTPUTS),
        })
      },
      prepare(draft: WorkbenchDraft) {
        return { payload: { id: nanoid(), ...draft } }
      },
    },
    workbenchUpdated(
      state,
      action: PayloadAction<{ id: string; changes: Partial<WorkbenchDraft> }>,
    ) {
      const wb = state.items.find((w) => w.id === action.payload.id)
      if (!wb) return
      const { changes } = action.payload
      if (changes.name !== undefined) wb.name = changes.name
      if (changes.color !== undefined) wb.color = changes.color
      if (changes.width !== undefined) wb.width = clampDim(changes.width)
      if (changes.depth !== undefined) wb.depth = clampDim(changes.depth)
      if (changes.height !== undefined) wb.height = clampDim(changes.height)
      if (changes.sloopSlots !== undefined)
        wb.sloopSlots = clampSloopSlots(changes.sloopSlots)
      if (changes.powerUsage !== undefined)
        wb.powerUsage = clampPower(changes.powerUsage)
      if (changes.inputs !== undefined)
        wb.inputs = clampPorts(changes.inputs, MAX_WORKBENCH_INPUTS)
      if (changes.outputs !== undefined)
        wb.outputs = clampPorts(changes.outputs, MAX_WORKBENCH_OUTPUTS)
    },
    workbenchRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((w) => w.id !== action.payload)
    },
    /** Move one input/output port to a position on the box face. */
    workbenchPortPosChanged(
      state,
      action: PayloadAction<{
        id: string
        side: 'inputs' | 'outputs'
        index: number
        pos: PortPos
      }>,
    ) {
      const wb = state.items.find((w) => w.id === action.payload.id)
      if (!wb) return
      const { side, index, pos } = action.payload
      const isInput = side === 'inputs'
      const count = isInput ? wb.inputs : wb.outputs
      if (index < 0 || index >= count) return
      // Build a full-length list (default edges) so older/shorter arrays grow.
      const list = Array.from(
        { length: count },
        (_, i) =>
          (isInput ? wb.inputPorts : wb.outputPorts)?.[i] ?? {
            fx: isInput ? 0 : 1,
            fy: (i + 1) / (count + 1),
          },
      )
      list[index] = pos
      if (isInput) wb.inputPorts = list
      else wb.outputPorts = list
    },
  },
})

export const {
  workbenchAdded,
  workbenchUpdated,
  workbenchRemoved,
  workbenchPortPosChanged,
} = workbenchesSlice.actions

export default workbenchesSlice.reducer
