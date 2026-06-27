import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import {
  MAX_WORKBENCH_DIM,
  MAX_WORKBENCH_SLOOP_SLOTS,
  MIN_WORKBENCH_DIM,
  MIN_WORKBENCH_SLOOP_SLOTS,
} from './constants'
import type { Workbench, WorkbenchDraft } from './types'

export interface WorkbenchesState {
  items: Workbench[]
}

const initialState: WorkbenchesState = {
  items: [],
}

const clampDim = (value: number): number =>
  Math.min(MAX_WORKBENCH_DIM, Math.max(MIN_WORKBENCH_DIM, Math.round(value)))

const clampSloopSlots = (value: number): number =>
  Math.min(
    MAX_WORKBENCH_SLOOP_SLOTS,
    Math.max(MIN_WORKBENCH_SLOOP_SLOTS, Math.round(value)),
  )

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
          height: clampDim(wb.height),
          sloopSlots: clampSloopSlots(wb.sloopSlots),
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
      if (changes.height !== undefined) wb.height = clampDim(changes.height)
      if (changes.sloopSlots !== undefined)
        wb.sloopSlots = clampSloopSlots(changes.sloopSlots)
    },
    workbenchRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((w) => w.id !== action.payload)
    },
  },
})

export const { workbenchAdded, workbenchUpdated, workbenchRemoved } =
  workbenchesSlice.actions

export default workbenchesSlice.reducer
