import { createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'

import { extractorRate, generatorClockFactor, placementFactors } from './calc'

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
const selectGeneratorItems = (s: RootState) => s.generators.items

/**
 * Factory-wide balance: sums recipe inputs/outputs across workbench placements
 * (scaled by quantity, overclock, sloops), material output from extractor
 * placements (scaled by tier, purity, overclock), and generator fuel/water
 * intake and waste output (scaled linearly by quantity and clock). Power is
 * NOT an item — it has its own balance (see power.ts).
 */
export const selectProductionBalance = createSelector(
  [
    selectByFloor,
    selectRecipeItems,
    selectWorkbenchItems,
    selectExtractorItems,
    selectGeneratorItems,
  ],
  (byFloor, recipes, workbenches, extractors, generators): ProductBalance[] => {
    const recipeById = new Map(recipes.map((r) => [r.id, r]))
    const sloopSlotsById = new Map(workbenches.map((w) => [w.id, w.sloopSlots]))
    const baseRateById = new Map(extractors.map((e) => [e.id, e.baseRate]))
    const generatorById = new Map(generators.map((g) => [g.id, g]))
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
        if (p.kind === 'generator') {
          const g = generatorById.get(p.refId)
          // A fuel-burning generator only runs (and drinks water) with a fuel
          // picked; geothermal touches no items at all.
          const fuel = g?.fuels.find((f) => f.refId === p.fuelId)
          if (!g || !fuel) continue
          const factor = generatorClockFactor(p)
          consumed.set(fuel.refId, (consumed.get(fuel.refId) ?? 0) + fuel.rate * factor)
          if (g.water) {
            consumed.set(
              g.water.refId,
              (consumed.get(g.water.refId) ?? 0) + g.water.rate * factor,
            )
          }
          if (fuel.byproduct) {
            produced.set(
              fuel.byproduct.refId,
              (produced.get(fuel.byproduct.refId) ?? 0) +
                fuel.byproduct.rate * factor,
            )
          }
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
