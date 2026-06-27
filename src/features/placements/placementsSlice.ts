import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

import { floorRemoved } from '@/features/floors/floorsSlice'
import { materialRemoved } from '@/features/materials/materialsSlice'
import { recipeRemoved } from '@/features/recipes/recipesSlice'
import { spacerRemoved } from '@/features/spacers/spacersSlice'
import { workbenchRemoved } from '@/features/workbenches/workbenchesSlice'

import {
  DEFAULT_CLOCK,
  DEFAULT_PLACEMENT_QUANTITY,
  DEFAULT_PURITY,
  DEFAULT_TIER,
  MAX_CLOCK,
  MAX_PLACEMENT_QUANTITY,
  MAX_SLOOPS,
  MAX_TIER,
  MIN_CLOCK,
  MIN_PLACEMENT_QUANTITY,
  MIN_TIER,
} from './constants'
import type {
  MachineConfig,
  Placement,
  PlacementKind,
  Purity,
} from './types'

export interface PlacementsState {
  /** Ordered placements per floor id (left→right sequence). */
  byFloor: Record<string, Placement[]>
  /** Id of the placement currently open in the inspector, or null. */
  selectedId: string | null
}

const initialState: PlacementsState = {
  byFloor: {},
  selectedId: null,
}

const clampQuantity = (value: number): number =>
  Math.min(
    MAX_PLACEMENT_QUANTITY,
    Math.max(MIN_PLACEMENT_QUANTITY, Math.round(value)),
  )

const groupedCount = (p: Placement): number =>
  p.configs.reduce((sum, c) => sum + c.count, 0)

/** Trim config counts (from the end) so their sum never exceeds quantity. */
const trimConfigs = (p: Placement): void => {
  let over = groupedCount(p) - p.quantity
  while (over > 0 && p.configs.length > 0) {
    const last = p.configs[p.configs.length - 1]
    if (last.count > over) {
      last.count -= over
      over = 0
    } else {
      over -= last.count
      p.configs.pop()
    }
  }
}

const findPlacement = (
  state: PlacementsState,
  id: string,
): Placement | undefined => {
  for (const floorId of Object.keys(state.byFloor)) {
    const found = state.byFloor[floorId].find((p) => p.id === id)
    if (found) return found
  }
  return undefined
}

/** Drop the selection if it no longer points at an existing placement. */
const validateSelection = (state: PlacementsState): void => {
  if (state.selectedId && !findPlacement(state, state.selectedId)) {
    state.selectedId = null
  }
}

/** Remove a placement by id from anywhere and return it. */
const extract = (
  state: PlacementsState,
  placementId: string,
): Placement | undefined => {
  for (const floorId of Object.keys(state.byFloor)) {
    const list = state.byFloor[floorId]
    const idx = list.findIndex((p) => p.id === placementId)
    if (idx !== -1) return list.splice(idx, 1)[0]
  }
  return undefined
}

/**
 * Insert a placement into a floor relative to `overId`. With `after` it lands
 * just after the target, otherwise just before. A null/unknown `overId` appends.
 */
const insert = (
  state: PlacementsState,
  floorId: string,
  placement: Placement,
  overId: string | null,
  after: boolean,
): void => {
  const list = (state.byFloor[floorId] ??= [])
  const at = overId ? list.findIndex((p) => p.id === overId) : -1
  if (at === -1) list.push(placement)
  else list.splice(at + (after ? 1 : 0), 0, placement)
}

const placementsSlice = createSlice({
  name: 'placements',
  initialState,
  reducers: {
    placementAdded: {
      reducer(
        state,
        action: PayloadAction<{
          placement: Placement
          floorId: string
          overId: string | null
          after: boolean
        }>,
      ) {
        const { placement, floorId, overId, after } = action.payload
        insert(state, floorId, placement, overId, after)
        state.selectedId = placement.id
      },
      prepare(args: {
        kind: PlacementKind
        refId: string
        floorId: string
        overId: string | null
        after: boolean
      }) {
        return {
          payload: {
            placement: {
              id: nanoid(),
              kind: args.kind,
              refId: args.refId,
              quantity: DEFAULT_PLACEMENT_QUANTITY,
              recipeId: null,
              configs: [],
              materialId: null,
              purity: DEFAULT_PURITY,
              tier: DEFAULT_TIER,
            },
            floorId: args.floorId,
            overId: args.overId,
            after: args.after,
          },
        }
      },
    },
    placementMoved(
      state,
      action: PayloadAction<{
        placementId: string
        toFloorId: string
        overId: string | null
        after: boolean
      }>,
    ) {
      const { placementId, toFloorId, overId, after } = action.payload
      const placement = extract(state, placementId)
      if (placement) insert(state, toFloorId, placement, overId, after)
    },
    placementRemoved(state, action: PayloadAction<string>) {
      extract(state, action.payload)
      if (state.selectedId === action.payload) state.selectedId = null
    },
    placementSelected(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload
    },
    placementQuantityChanged(
      state,
      action: PayloadAction<{ id: string; quantity: number }>,
    ) {
      const placement = findPlacement(state, action.payload.id)
      if (!placement) return
      placement.quantity = clampQuantity(action.payload.quantity)
      trimConfigs(placement)
    },
    placementRecipeChanged(
      state,
      action: PayloadAction<{ id: string; recipeId: string | null }>,
    ) {
      const placement = findPlacement(state, action.payload.id)
      if (placement) placement.recipeId = action.payload.recipeId
    },
    placementMaterialChanged(
      state,
      action: PayloadAction<{ id: string; materialId: string | null }>,
    ) {
      const placement = findPlacement(state, action.payload.id)
      if (placement) placement.materialId = action.payload.materialId
    },
    placementPurityChanged(
      state,
      action: PayloadAction<{ id: string; purity: Purity }>,
    ) {
      const placement = findPlacement(state, action.payload.id)
      if (placement) placement.purity = action.payload.purity
    },
    placementTierChanged(
      state,
      action: PayloadAction<{ id: string; tier: number }>,
    ) {
      const placement = findPlacement(state, action.payload.id)
      if (placement) {
        placement.tier = Math.min(
          MAX_TIER,
          Math.max(MIN_TIER, Math.round(action.payload.tier)),
        )
      }
    },
    /** Add an overclock/sloop config group, pulling 1 machine from the base. */
    placementConfigAdded: {
      reducer(
        state,
        action: PayloadAction<{ id: string; config: MachineConfig }>,
      ) {
        const placement = findPlacement(state, action.payload.id)
        if (!placement) return
        if (groupedCount(placement) >= placement.quantity) return
        placement.configs.push(action.payload.config)
      },
      prepare(id: string) {
        return {
          payload: {
            id,
            config: {
              id: nanoid(),
              count: 1,
              clock: DEFAULT_CLOCK,
              sloops: 0,
            } as MachineConfig,
          },
        }
      },
    },
    placementConfigChanged(
      state,
      action: PayloadAction<{
        id: string
        configId: string
        changes: Partial<Omit<MachineConfig, 'id'>>
      }>,
    ) {
      const placement = findPlacement(state, action.payload.id)
      const config = placement?.configs.find(
        (c) => c.id === action.payload.configId,
      )
      if (!placement || !config) return
      const { changes } = action.payload
      if (changes.clock !== undefined) {
        config.clock = Math.min(MAX_CLOCK, Math.max(MIN_CLOCK, changes.clock))
      }
      if (changes.sloops !== undefined) {
        config.sloops = Math.min(MAX_SLOOPS, Math.max(0, Math.round(changes.sloops)))
      }
      if (changes.count !== undefined) {
        const others = groupedCount(placement) - config.count
        const maxCount = Math.max(1, placement.quantity - others)
        config.count = Math.min(maxCount, Math.max(1, Math.round(changes.count)))
      }
    },
    placementConfigRemoved(
      state,
      action: PayloadAction<{ id: string; configId: string }>,
    ) {
      const placement = findPlacement(state, action.payload.id)
      if (placement) {
        placement.configs = placement.configs.filter(
          (c) => c.id !== action.payload.configId,
        )
      }
    },
  },
  extraReducers: (builder) => {
    // Clean up placements when a floor, workbench, or spacer is deleted.
    builder.addCase(floorRemoved, (state, action) => {
      delete state.byFloor[action.payload]
      validateSelection(state)
    })
    builder.addCase(workbenchRemoved, (state, action) => {
      for (const floorId of Object.keys(state.byFloor)) {
        state.byFloor[floorId] = state.byFloor[floorId].filter(
          (p) => !(p.kind === 'workbench' && p.refId === action.payload),
        )
      }
      validateSelection(state)
    })
    builder.addCase(spacerRemoved, (state, action) => {
      for (const floorId of Object.keys(state.byFloor)) {
        state.byFloor[floorId] = state.byFloor[floorId].filter(
          (p) => !(p.kind === 'spacer' && p.refId === action.payload),
        )
      }
      validateSelection(state)
    })
    // Unassign a recipe from any placement when that recipe is deleted.
    builder.addCase(recipeRemoved, (state, action) => {
      for (const floorId of Object.keys(state.byFloor)) {
        for (const p of state.byFloor[floorId]) {
          if (p.recipeId === action.payload) p.recipeId = null
        }
      }
    })
    // Unassign a material from any extractor placement when it's deleted.
    builder.addCase(materialRemoved, (state, action) => {
      for (const floorId of Object.keys(state.byFloor)) {
        for (const p of state.byFloor[floorId]) {
          if (p.materialId === action.payload) p.materialId = null
        }
      }
    })
  },
})

export const {
  placementAdded,
  placementMoved,
  placementRemoved,
  placementSelected,
  placementQuantityChanged,
  placementRecipeChanged,
  placementMaterialChanged,
  placementPurityChanged,
  placementTierChanged,
  placementConfigAdded,
  placementConfigChanged,
  placementConfigRemoved,
} = placementsSlice.actions

export default placementsSlice.reducer
