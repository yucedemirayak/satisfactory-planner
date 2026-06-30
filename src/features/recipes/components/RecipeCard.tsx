import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { workbenchLabel } from '@/features/workbenches/helpers'
import { selectWorkbenches } from '@/features/workbenches/selectors'

import { MAX_BY_SIDE } from '../constants'
import { recipeLabel } from '../helpers'
import {
  recipeLineAdded,
  recipeRemoved,
  recipeRenamed,
  recipeWorkbenchChanged,
} from '../recipesSlice'
import type { Recipe, RecipeItem, RecipeSide } from '../types'
import { RecipeLine } from './RecipeLine'

interface RecipeColumnProps {
  recipeId: string
  side: RecipeSide
  title: string
  lines: RecipeItem[]
  /** Port cap from the assigned workbench, else the recipe's own max. */
  max: number
  /** Whether the cap comes from a bound workbench (affects the warning copy). */
  workbenchBound: boolean
}

function RecipeColumn({
  recipeId,
  side,
  title,
  lines,
  max,
  workbenchBound,
}: RecipeColumnProps) {
  const dispatch = useAppDispatch()
  const full = lines.length >= max
  // Can only exceed the cap if the workbench was shrunk after lines were added.
  const over = lines.length > max

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
        {title}{' '}
        <span className={`font-mono ${over ? 'text-amber-400' : 'text-gray-600'}`}>
          ({lines.length}/{max})
        </span>
      </h3>
      {lines.map((line, index) => (
        <RecipeLine
          key={index}
          recipeId={recipeId}
          side={side}
          index={index}
          line={line}
        />
      ))}
      {over && (
        <p className="text-xs text-amber-400">
          ⚠ Too many — this workbench has only {max}{' '}
          {side === 'inputs' ? 'input' : 'output'}
          {max === 1 ? '' : 's'}.
        </p>
      )}
      <button
        type="button"
        disabled={full}
        onClick={() => dispatch(recipeLineAdded({ id: recipeId, side }))}
        title={
          full && workbenchBound
            ? "Limited by the assigned workbench's port count"
            : undefined
        }
        className="self-start rounded-md border border-dashed border-edge px-2 py-1 text-xs text-gray-400 transition hover:border-ficsit hover:text-ficsit disabled:cursor-not-allowed disabled:opacity-40"
      >
        + Add {side === 'inputs' ? 'input' : 'output'}
      </button>
    </div>
  )
}

interface RecipeCardProps {
  recipe: Recipe
  index: number
}

/** A recipe with inline-editable name, made-in workbench, inputs and outputs. */
export function RecipeCard({ recipe, index }: RecipeCardProps) {
  const dispatch = useAppDispatch()
  const workbenches = useAppSelector(selectWorkbenches)

  // When bound to a workbench, the line caps come from its port counts;
  // otherwise the recipe's own absolute maxima apply.
  const boundWorkbench = recipe.workbenchId
    ? workbenches.find((w) => w.id === recipe.workbenchId)
    : undefined
  const inputMax = boundWorkbench ? boundWorkbench.inputs : MAX_BY_SIDE.inputs
  const outputMax = boundWorkbench ? boundWorkbench.outputs : MAX_BY_SIDE.outputs

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={recipe.name}
          placeholder={recipeLabel(recipe, index)}
          onChange={(e) =>
            dispatch(recipeRenamed({ id: recipe.id, name: e.target.value }))
          }
          className="min-w-0 flex-1 rounded-md border border-edge bg-surface-0 px-2.5 py-1.5 text-sm font-medium text-gray-100 outline-none focus:border-ficsit"
        />
        <button
          type="button"
          onClick={() => dispatch(recipeRemoved(recipe.id))}
          className="shrink-0 rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/15"
        >
          Delete
        </button>
      </div>

      <label className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium text-gray-400">
          Made in
        </span>
        <select
          value={recipe.workbenchId ?? ''}
          onChange={(e) =>
            dispatch(
              recipeWorkbenchChanged({
                id: recipe.id,
                workbenchId: e.target.value || null,
              }),
            )
          }
          className="min-w-0 flex-1 rounded-md border border-edge bg-surface-0 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-ficsit"
        >
          <option value="">Any workbench</option>
          {workbenches.map((w, i) => (
            <option key={w.id} value={w.id}>
              {workbenchLabel(w, i)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RecipeColumn
          recipeId={recipe.id}
          side="inputs"
          title="Inputs"
          lines={recipe.inputs}
          max={inputMax}
          workbenchBound={Boolean(boundWorkbench)}
        />
        <RecipeColumn
          recipeId={recipe.id}
          side="outputs"
          title="Outputs"
          lines={recipe.outputs}
          max={outputMax}
          workbenchBound={Boolean(boundWorkbench)}
        />
      </div>
    </div>
  )
}
