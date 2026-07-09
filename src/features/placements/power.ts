import { createSelector } from '@reduxjs/toolkit'

import type { RootState } from '@/app/store'

import {
  extractorPowerUsage,
  generatorPower,
  placementPowerFactor,
} from './calc'

/** One line of the power breakdown: all placements of one building type. */
export interface PowerGroupRow {
  kind: 'workbench' | 'extractor' | 'generator'
  /** Building definition id (workbench / extractor / generator). */
  refId: string
  /** Total machines of this building across the factory (active ones). */
  machines: number
  /** Total MW this group draws (consumers) or produces (producers). */
  mw: number
}

/** Per-floor production vs consumption, in floor-stack order. */
export interface FloorPowerRow {
  floorId: string
  production: number
  consumption: number
}

export interface PowerBalance {
  /** Total MW generated across the factory. */
  production: number
  /** Total MW drawn across the factory. */
  consumption: number
  /** production − consumption: negative = blackout. */
  net: number
  producers: PowerGroupRow[]
  consumers: PowerGroupRow[]
  byFloor: FloorPowerRow[]
}

const selectByFloor = (s: RootState) => s.placements.byFloor
const selectFloorItems = (s: RootState) => s.floors.items
const selectRecipeItems = (s: RootState) => s.recipes.items
const selectWorkbenchItems = (s: RootState) => s.workbenches.items
const selectExtractorItems = (s: RootState) => s.extractors.items
const selectGeneratorItems = (s: RootState) => s.generators.items

/**
 * Factory-wide power balance. Only ACTIVE machines count: a workbench draws
 * power when a recipe is assigned (the recipe's own MW when set — variable-
 * power machines — else the workbench's), an extractor when a material is
 * assigned, and a generator produces when it has a fuel picked (fuel-less
 * geothermal always runs, scaled by purity). Consumption scales with
 * clock^1.321928 and sloop amplification²; generation scales linearly.
 */
export const selectPowerBalance = createSelector(
  [
    selectByFloor,
    selectFloorItems,
    selectRecipeItems,
    selectWorkbenchItems,
    selectExtractorItems,
    selectGeneratorItems,
  ],
  (byFloor, floors, recipes, workbenches, extractors, generators): PowerBalance => {
    const recipeById = new Map(recipes.map((r) => [r.id, r]))
    const wbById = new Map(workbenches.map((w) => [w.id, w]))
    const exById = new Map(extractors.map((e) => [e.id, e]))
    const genById = new Map(generators.map((g) => [g.id, g]))

    const producers = new Map<string, PowerGroupRow>()
    const consumers = new Map<string, PowerGroupRow>()
    const floorRows = new Map<string, FloorPowerRow>()
    const add = (
      groups: Map<string, PowerGroupRow>,
      kind: PowerGroupRow['kind'],
      refId: string,
      machines: number,
      mw: number,
    ) => {
      const row = groups.get(refId)
      if (row) {
        row.machines += machines
        row.mw += mw
      } else {
        groups.set(refId, { kind, refId, machines, mw })
      }
    }

    let production = 0
    let consumption = 0
    for (const floorId of Object.keys(byFloor)) {
      let floorProduction = 0
      let floorConsumption = 0
      for (const p of byFloor[floorId]) {
        if (p.kind === 'workbench') {
          if (!p.recipeId) continue
          const wb = wbById.get(p.refId)
          const recipe = recipeById.get(p.recipeId)
          if (!wb || !recipe) continue
          const perMachine = recipe.power ?? wb.powerUsage ?? 0
          const mw = perMachine * placementPowerFactor(p, wb.sloopSlots)
          floorConsumption += mw
          add(consumers, 'workbench', p.refId, p.quantity, mw)
        } else if (p.kind === 'extractor') {
          if (!p.materialId) continue
          const ex = exById.get(p.refId)
          if (!ex) continue
          const perMachine = ex.powerUsage
            ? extractorPowerUsage(ex.powerUsage, p.tier)
            : 0
          const mw = perMachine * placementPowerFactor(p, 0)
          floorConsumption += mw
          add(consumers, 'extractor', p.refId, p.quantity, mw)
        } else if (p.kind === 'generator') {
          const g = genById.get(p.refId)
          if (!g) continue
          const mw = generatorPower(p, g)
          if (mw <= 0) continue
          floorProduction += mw
          add(producers, 'generator', p.refId, p.quantity, mw)
        }
      }
      if (floorProduction > 0 || floorConsumption > 0) {
        floorRows.set(floorId, {
          floorId,
          production: floorProduction,
          consumption: floorConsumption,
        })
      }
      production += floorProduction
      consumption += floorConsumption
    }

    const byMw = (a: PowerGroupRow, b: PowerGroupRow) => b.mw - a.mw
    return {
      production,
      consumption,
      net: production - consumption,
      producers: [...producers.values()].sort(byMw),
      consumers: [...consumers.values()].sort(byMw),
      // Floor-stack order (top floor first, like the plan renders them).
      byFloor: floors
        .map((f) => floorRows.get(f.id))
        .filter((r): r is FloorPowerRow => r !== undefined),
    }
  },
)
