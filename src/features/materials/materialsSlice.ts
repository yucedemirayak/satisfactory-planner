import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import { extractorRemoved } from '@/features/extractors/extractorsSlice'

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
      if (!material) return
      const { changes } = action.payload
      if (changes.name !== undefined) material.name = changes.name
      if (changes.extractorId !== undefined)
        material.extractorId = changes.extractorId
      if (changes.phase !== undefined) material.phase = changes.phase
    },
    materialRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((m) => m.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    // A removed extractor leaves its materials unassigned (not dangling).
    builder.addCase(extractorRemoved, (state, action) => {
      for (const m of state.items) {
        if (m.extractorId === action.payload) m.extractorId = null
      }
    })
  },
})

export const { materialAdded, materialUpdated, materialRemoved } =
  materialsSlice.actions

export default materialsSlice.reducer
