import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectConveyors } from '@/features/conveyors'
import { selectPipelines } from '@/features/pipelines'
import { MAX_TIER, MIN_TIER } from '@/features/placements/constants'

import { defaultsChanged } from '../defaultsSlice'
import { selectDefaults } from '../selectors'

const selectCls =
  'rounded-md border border-edge bg-surface-0 px-1.5 py-1 text-xs text-gray-100 outline-none focus:border-ficsit'

const TIERS = Array.from(
  { length: MAX_TIER - MIN_TIER + 1 },
  (_, i) => MIN_TIER + i,
)

/** Toolbar pickers for the tiers NEW connections / extractor placements get. */
export function PlanDefaultsControl() {
  const dispatch = useAppDispatch()
  const defaults = useAppSelector(selectDefaults)
  const conveyors = useAppSelector(selectConveyors)
  const pipelines = useAppSelector(selectPipelines)

  return (
    <div className="flex items-center gap-x-4 gap-y-2">
      <label className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Belt</span>
        <select
          value={defaults.conveyorId ?? conveyors[0]?.id ?? ''}
          onChange={(e) =>
            dispatch(defaultsChanged({ conveyorId: e.target.value || null }))
          }
          aria-label="Default conveyor for new connections"
          className={selectCls}
        >
          {conveyors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Pipe</span>
        <select
          value={defaults.pipelineId ?? pipelines[0]?.id ?? ''}
          onChange={(e) =>
            dispatch(defaultsChanged({ pipelineId: e.target.value || null }))
          }
          aria-label="Default pipeline for new fluid connections"
          className={selectCls}
        >
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Miner</span>
        <select
          value={defaults.extractorTier}
          onChange={(e) =>
            dispatch(defaultsChanged({ extractorTier: Number(e.target.value) }))
          }
          aria-label="Default tier for new extractor placements"
          className={selectCls}
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>
              Mk.{t}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
