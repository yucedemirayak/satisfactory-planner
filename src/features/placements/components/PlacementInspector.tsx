import { Link } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { PATHS } from '@/app/paths'
import { materialAssignableTo, selectMaterials } from '@/features/materials'
import { selectProducts } from '@/features/products'
import {
  recipeAssignableTo,
  recipeFitsWorkbench,
  recipeLabel,
  selectRecipes,
} from '@/features/recipes'
import type { RecipeItem } from '@/features/recipes'

import {
  extractorPowerUsage,
  extractorRate,
  generatorClockFactor,
  generatorPower,
  placementFactors,
  placementPowerFactor,
} from '../calc'
import {
  MAX_CLOCK,
  MAX_PLACEMENT_QUANTITY,
  MIN_CLOCK,
  MIN_PLACEMENT_QUANTITY,
} from '../constants'
import {
  placementConfigAdded,
  placementConfigChanged,
  placementConfigRemoved,
  placementFuelChanged,
  placementMaterialChanged,
  placementPurityChanged,
  placementQuantityChanged,
  placementRecipeChanged,
  placementRemoved,
  placementTierChanged,
} from '../placementsSlice'
import { selectSelectedPlacement } from '../selectors'
import type { Placement, Purity } from '../types'

/** Power shards needed to overclock one machine to `clock` percent. */
const shardsForClock = (clock: number) =>
  Math.max(0, Math.ceil((clock - 100) / 50))

const numInput =
  'rounded-md border border-edge bg-surface-0 px-1.5 py-1 text-center font-mono text-sm text-gray-100 outline-none focus:border-ficsit'

const fmt = (n: number) => Number(n.toFixed(3)).toString()

const PURITIES: Purity[] = ['impure', 'normal', 'pure']

/** Overclock / somersloop config groups (shared by workbenches & extractors). */
function MachineConfigs({
  placement,
  sloopSlots,
}: {
  placement: Placement
  sloopSlots: number
}) {
  const dispatch = useAppDispatch()
  const grouped = placement.configs.reduce((s, c) => s + c.count, 0)
  const baseCount = Math.max(0, placement.quantity - grouped)
  const factors = placementFactors(placement, sloopSlots)
  const totalShards = placement.configs.reduce(
    (s, c) => s + c.count * shardsForClock(c.clock),
    0,
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">
          Overclock{sloopSlots > 0 ? ' & Sloops' : ''}
        </span>
        <button
          type="button"
          disabled={baseCount <= 0}
          onClick={() => dispatch(placementConfigAdded(placement.id))}
          className="rounded border border-dashed border-edge px-1.5 py-0.5 text-xs text-gray-400 transition hover:border-ficsit hover:text-ficsit disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Group
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {baseCount} @ 100%{sloopSlots > 0 ? ', 0 sloops' : ''} (base)
      </p>

      {placement.configs.map((c) => (
        <div
          key={c.id}
          className="flex flex-col gap-1.5 rounded-md border border-edge bg-surface-0 p-2"
        >
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <input
              type="number"
              min={1}
              max={placement.quantity}
              value={c.count}
              onChange={(e) =>
                dispatch(
                  placementConfigChanged({
                    id: placement.id,
                    configId: c.id,
                    changes: { count: Number(e.target.value) },
                  }),
                )
              }
              className={`w-12 ${numInput}`}
              aria-label="Machines"
            />
            <span>@</span>
            <input
              type="number"
              min={MIN_CLOCK}
              max={MAX_CLOCK}
              value={c.clock}
              onChange={(e) =>
                dispatch(
                  placementConfigChanged({
                    id: placement.id,
                    configId: c.id,
                    changes: { clock: Number(e.target.value) },
                  }),
                )
              }
              className={`w-14 ${numInput}`}
              aria-label="Clock percent"
            />
            <span>%</span>
            <button
              type="button"
              onClick={() =>
                dispatch(
                  placementConfigRemoved({ id: placement.id, configId: c.id }),
                )
              }
              className="ml-auto rounded px-1.5 py-0.5 text-red-400 transition hover:bg-red-500/15"
              aria-label="Remove group"
            >
              ✕
            </button>
          </div>
          {sloopSlots > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>Sloops</span>
              <input
                type="number"
                min={0}
                max={sloopSlots}
                value={c.sloops}
                onChange={(e) =>
                  dispatch(
                    placementConfigChanged({
                      id: placement.id,
                      configId: c.id,
                      changes: { sloops: Number(e.target.value) },
                    }),
                  )
                }
                className={`w-12 ${numInput}`}
                aria-label="Somersloops"
              />
              <span className="text-gray-500">/ {sloopSlots} each</span>
            </div>
          )}
        </div>
      ))}

      {(totalShards > 0 || factors.sloops > 0) && (
        <p className="text-xs text-gray-500">
          Needs{' '}
          {totalShards > 0 && (
            <span className="text-ficsit">⚡ {totalShards} shards</span>
          )}
          {totalShards > 0 && factors.sloops > 0 && ' · '}
          {factors.sloops > 0 && (
            <span className="text-ficsit">◇ {factors.sloops} sloops</span>
          )}
        </p>
      )}
    </div>
  )
}

/** Inspector for the currently selected placed item. */
export function PlacementInspector() {
  const dispatch = useAppDispatch()
  const placement = useAppSelector(selectSelectedPlacement)
  const workbench = useAppSelector((s) =>
    placement?.kind === 'workbench'
      ? s.workbenches.items.find((w) => w.id === placement.refId)
      : undefined,
  )
  const extractor = useAppSelector((s) =>
    placement?.kind === 'extractor'
      ? s.extractors.items.find((e) => e.id === placement.refId)
      : undefined,
  )
  const generator = useAppSelector((s) =>
    placement?.kind === 'generator'
      ? s.generators.items.find((g) => g.id === placement.refId)
      : undefined,
  )
  const recipes = useAppSelector(selectRecipes)
  const products = useAppSelector(selectProducts)
  const materials = useAppSelector(selectMaterials)

  if (!placement)
    return (
      <aside className="rounded-lg border border-edge bg-surface-1 p-4">
        <p className="text-sm text-gray-500">Select a machine to edit.</p>
      </aside>
    )

  const box = workbench ?? extractor ?? generator
  const title = box?.name || 'Placed item'
  const setQuantity = (quantity: number) =>
    dispatch(placementQuantityChanged({ id: placement.id, quantity }))

  const itemName = (id: string) =>
    products.find((p) => p.id === id)?.name ||
    materials.find((m) => m.id === id)?.name ||
    '?'
  const renderSide = (items: RecipeItem[], multiplier: number) =>
    items.length === 0 ? (
      <div className="text-gray-600">—</div>
    ) : (
      items.map((it, i) => (
        <div key={i} className="truncate">
          {itemName(it.refId)}{' '}
          <span className="text-gray-300">{fmt(it.rate * multiplier)}/min</span>
        </div>
      ))
    )

  // Workbench recipe scaling. Only recipes that fit this workbench's ports (and
  // are bound to it / unbound) are assignable; the current pick always shows.
  const assignedRecipe = recipes.find((r) => r.id === placement.recipeId)
  const availableRecipes = workbench
    ? recipes
        .map((recipe, index) => ({ recipe, index }))
        .filter(
          ({ recipe }) =>
            recipeAssignableTo(recipe, workbench) ||
            recipe.id === placement.recipeId,
        )
    : []
  const recipeMisfit =
    assignedRecipe && workbench && !recipeFitsWorkbench(assignedRecipe, workbench)
  const factors = placementFactors(placement, workbench?.sloopSlots ?? 0)

  // Extractor: only materials this extractor mines (or unassigned) are offered;
  // the current pick always stays visible.
  const availableMaterials = extractor
    ? materials.filter(
        (m) =>
          materialAssignableTo(m, placement.refId) ||
          m.id === placement.materialId,
      )
    : materials

  return (
    <aside className="flex flex-col gap-4 rounded-lg border border-ficsit/40 bg-surface-1 p-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 truncate text-sm font-semibold tracking-wide text-gray-300 uppercase">
          {box && (
            <span
              className="size-3 shrink-0 rounded-sm border"
              style={{ borderColor: box.color, backgroundColor: `${box.color}33` }}
            />
          )}
          <span className="truncate">{title}</span>
        </h2>
        <button
          type="button"
          onClick={() => dispatch(placementRemoved(placement.id))}
          className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
        >
          Remove
        </button>
      </header>

      {box && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Quantity</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantity(placement.quantity - 1)}
              className="flex size-6 items-center justify-center rounded border border-edge bg-surface-2 text-gray-300 transition hover:border-ficsit hover:text-ficsit"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input
              type="number"
              min={MIN_PLACEMENT_QUANTITY}
              max={MAX_PLACEMENT_QUANTITY}
              value={placement.quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={`w-16 ${numInput}`}
            />
            <button
              type="button"
              onClick={() => setQuantity(placement.quantity + 1)}
              className="flex size-6 items-center justify-center rounded border border-edge bg-surface-2 text-gray-300 transition hover:border-ficsit hover:text-ficsit"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Workbench: recipe + In/Out */}
      {placement.kind === 'workbench' && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-400">Recipe</span>
            <select
              value={placement.recipeId ?? ''}
              onChange={(e) =>
                dispatch(
                  placementRecipeChanged({
                    id: placement.id,
                    recipeId: e.target.value || null,
                  }),
                )
              }
              className="rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
            >
              <option value="">None</option>
              {availableRecipes.map(({ recipe, index }) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipeLabel(recipe, index)}
                </option>
              ))}
            </select>
            {availableRecipes.length === 0 && (
              <span className="text-xs text-gray-500">
                No recipes for this workbench —{' '}
                <Link to={PATHS.recipes} className="text-ficsit hover:underline">
                  add one
                </Link>
                .
              </span>
            )}
            {workbench && (
              <span className="text-xs text-gray-500">
                Ports: {workbench.inputs} in · {workbench.outputs} out
              </span>
            )}
            {recipeMisfit && (
              <span className="text-xs text-amber-400">
                ⚠ Recipe needs more ports than this workbench has.
              </span>
            )}
          </label>

          <MachineConfigs placement={placement} sloopSlots={workbench?.sloopSlots ?? 0} />

          {assignedRecipe && (
            <div className="flex flex-col gap-2 rounded-md border border-edge bg-surface-0 p-2 text-xs text-gray-400">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-gray-500 uppercase">In</span>
                {renderSide(assignedRecipe.inputs, factors.input)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-gray-500 uppercase">Out</span>
                {renderSide(assignedRecipe.outputs, factors.output)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-gray-500 uppercase">Power</span>
                <div>
                  <span className="text-amber-300">
                    {fmt(
                      (assignedRecipe.power ?? workbench?.powerUsage ?? 0) *
                        placementPowerFactor(placement, workbench?.sloopSlots ?? 0),
                    )}{' '}
                    MW
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Extractor: material + purity + tier + output */}
      {placement.kind === 'extractor' && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-400">Material</span>
            <select
              value={placement.materialId ?? ''}
              onChange={(e) =>
                dispatch(
                  placementMaterialChanged({
                    id: placement.id,
                    materialId: e.target.value || null,
                  }),
                )
              }
              className="rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
            >
              <option value="">None</option>
              {availableMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {availableMaterials.length === 0 && (
              <span className="text-xs text-gray-500">
                {materials.length === 0 ? (
                  <>
                    No materials yet —{' '}
                    <Link
                      to={PATHS.materials}
                      className="text-ficsit hover:underline"
                    >
                      add one
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    No materials assigned to this extractor — set one on the{' '}
                    <Link
                      to={PATHS.materials}
                      className="text-ficsit hover:underline"
                    >
                      Materials
                    </Link>{' '}
                    page.
                  </>
                )}
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Tier</span>
              <select
                value={placement.tier}
                onChange={(e) =>
                  dispatch(
                    placementTierChanged({
                      id: placement.id,
                      tier: Number(e.target.value),
                    }),
                  )
                }
                className="rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
              >
                <option value={1}>Mk.1</option>
                <option value={2}>Mk.2</option>
                <option value={3}>Mk.3</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Purity</span>
              <select
                value={placement.purity}
                onChange={(e) =>
                  dispatch(
                    placementPurityChanged({
                      id: placement.id,
                      purity: e.target.value as Purity,
                    }),
                  )
                }
                className="rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 capitalize outline-none focus:border-ficsit"
              >
                {PURITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <MachineConfigs placement={placement} sloopSlots={0} />

          {extractor && placement.materialId && (
            <div className="flex flex-col gap-2 rounded-md border border-edge bg-surface-0 p-2 text-xs text-gray-400">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-gray-500 uppercase">Out</span>
                <div className="truncate">
                  {itemName(placement.materialId)}{' '}
                  <span className="text-gray-300">
                    {fmt(extractorRate(placement, extractor.baseRate))}/min
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-gray-500 uppercase">Power</span>
                <div>
                  <span className="text-amber-300">
                    {fmt(
                      extractorPowerUsage(extractor.powerUsage, placement.tier) *
                        placementPowerFactor(placement, 0),
                    )}{' '}
                    MW
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Generator: fuel (or purity for fuel-less) + power/flows */}
      {placement.kind === 'generator' && generator && (
        <>
          {generator.fuels.length > 0 ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Fuel</span>
              <select
                value={placement.fuelId ?? ''}
                onChange={(e) =>
                  dispatch(
                    placementFuelChanged({
                      id: placement.id,
                      fuelId: e.target.value || null,
                    }),
                  )
                }
                className="rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
              >
                <option value="">None (off)</option>
                {generator.fuels.map((f) => (
                  <option key={f.refId} value={f.refId}>
                    {itemName(f.refId)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400">Purity</span>
              <select
                value={placement.purity}
                onChange={(e) =>
                  dispatch(
                    placementPurityChanged({
                      id: placement.id,
                      purity: e.target.value as Purity,
                    }),
                  )
                }
                className="rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 capitalize outline-none focus:border-ficsit"
              >
                {PURITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          )}

          <MachineConfigs placement={placement} sloopSlots={0} />

          {(() => {
            const fuel = generator.fuels.find((f) => f.refId === placement.fuelId)
            const factor = generatorClockFactor(placement)
            const mw = generatorPower(placement, generator)
            const running = generator.fuels.length === 0 || fuel
            return (
              <div className="flex flex-col gap-2 rounded-md border border-edge bg-surface-0 p-2 text-xs text-gray-400">
                {fuel && (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-500 uppercase">In</span>
                    <div className="truncate">
                      {itemName(fuel.refId)}{' '}
                      <span className="text-gray-300">
                        {fmt(fuel.rate * factor)}/min
                      </span>
                    </div>
                    {generator.water && (
                      <div className="truncate">
                        {itemName(generator.water.refId)}{' '}
                        <span className="text-gray-300">
                          {fmt(generator.water.rate * factor)}/min
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {fuel?.byproduct && (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-500 uppercase">Out</span>
                    <div className="truncate">
                      {itemName(fuel.byproduct.refId)}{' '}
                      <span className="text-gray-300">
                        {fmt(fuel.byproduct.rate * factor)}/min
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-gray-500 uppercase">Power</span>
                  <div>
                    {running ? (
                      <span className="text-emerald-400">+{fmt(mw)} MW</span>
                    ) : (
                      <span className="text-gray-500">Off — pick a fuel</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </>
      )}

    </aside>
  )
}
