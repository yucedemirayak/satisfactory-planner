import { createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'

import { extractorRate, placementFactors } from './calc'

export interface ProductBalance {
  /** Product or material id (ids are globally unique). */
  refId: string
  /** Total produced per minute across the whole factory (gross output). */
  produced: number
  /** Total consumed per minute across the whole factory (gross input). */
  consumed: number
  /** produced − consumed: positive = surplus, negative = deficit. */
  net: number
}

const selectByFloor = (s: RootState) => s.placements.byFloor
const selectRecipeItems = (s: RootState) => s.recipes.items
const selectWorkbenchItems = (s: RootState) => s.workbenches.items
const selectExtractorItems = (s: RootState) => s.extractors.items

/**
 * Factory-wide balance: sums recipe inputs/outputs across workbench placements
 * (scaled by quantity, overclock, sloops) plus material output from extractor
 * placements (scaled by tier, purity, overclock).
 */
export const selectProductionBalance = createSelector(
  [selectByFloor, selectRecipeItems, selectWorkbenchItems, selectExtractorItems],
  (byFloor, recipes, workbenches, extractors): ProductBalance[] => {
    const recipeById = new Map(recipes.map((r) => [r.id, r]))
    const sloopSlotsById = new Map(workbenches.map((w) => [w.id, w.sloopSlots]))
    const baseRateById = new Map(extractors.map((e) => [e.id, e.baseRate]))
    const produced = new Map<string, number>()
    const consumed = new Map<string, number>()

    for (const floorId of Object.keys(byFloor)) {
      for (const p of byFloor[floorId]) {
        if (p.kind === 'extractor') {
          if (!p.materialId) continue
          const baseRate = baseRateById.get(p.refId)
          if (baseRate === undefined) continue
          produced.set(
            p.materialId,
            (produced.get(p.materialId) ?? 0) + extractorRate(p, baseRate),
          )
          continue
        }
        if (p.kind !== 'workbench' || !p.recipeId) continue
        const recipe = recipeById.get(p.recipeId)
        if (!recipe) continue
        const { input, output } = placementFactors(
          p,
          sloopSlotsById.get(p.refId) ?? 0,
        )
        for (const it of recipe.inputs) {
          if (!it.refId) continue
          consumed.set(it.refId, (consumed.get(it.refId) ?? 0) + it.rate * input)
        }
        for (const it of recipe.outputs) {
          if (!it.refId) continue
          produced.set(it.refId, (produced.get(it.refId) ?? 0) + it.rate * output)
        }
      }
    }

    const ids = new Set([...produced.keys(), ...consumed.keys()])
    return [...ids].map((refId) => {
      const pr = produced.get(refId) ?? 0
      const co = consumed.get(refId) ?? 0
      return { refId, produced: pr, consumed: co, net: pr - co }
    })
  },
)
