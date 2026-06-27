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
}

function RecipeColumn({ recipeId, side, title, lines }: RecipeColumnProps) {
  const dispatch = useAppDispatch()
  const max = MAX_BY_SIDE[side]
  const full = lines.length >= max

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
        {title}{' '}
        <span className="font-mono text-gray-600">
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
      <button
        type="button"
        disabled={full}
        onClick={() => dispatch(recipeLineAdded({ id: recipeId, side }))}
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
        />
        <RecipeColumn
          recipeId={recipe.id}
          side="outputs"
          title="Outputs"
          lines={recipe.outputs}
        />
      </div>
    </div>
  )
}
