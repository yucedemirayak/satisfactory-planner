import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import type { Material, MaterialDraft } from './types'

export interface MaterialsState {
  items: Material[]
}

const initialState: MaterialsState = {
  items: [],
}

const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    materialAdded: {
      reducer(state, action: PayloadAction<Material>) {
        state.items.push(action.payload)
      },
      prepare(draft: MaterialDraft) {
        return { payload: { id: nanoid(), ...draft } }
      },
    },
    materialUpdated(
      state,
      action: PayloadAction<{ id: string; changes: Partial<MaterialDraft> }>,
    ) {
      const material = state.items.find((m) => m.id === action.payload.id)
      if (material && action.payload.changes.name !== undefined) {
        material.name = action.payload.changes.name
      }
    },
    materialRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((m) => m.id !== action.payload)
    },
  },
})

export const { materialAdded, materialUpdated, materialRemoved } =
  materialsSlice.actions

export default materialsSlice.reducer
