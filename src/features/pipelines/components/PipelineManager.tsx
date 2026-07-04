import { useAppSelector } from '@/app/hooks'

import { selectPipelineCount, selectPipelines } from '../selectors'
import { PipelineCard } from './PipelineCard'
import { PipelineForm } from './PipelineForm'

/** Page for defining pipeline tiers and their max throughput (m³/min). */
export function PipelineManager() {
  const pipelines = useAppSelector(selectPipelines)
  const count = useAppSelector(selectPipelineCount)

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Pipelines</h1>
          <p className="text-sm text-gray-500">
            Pipe tiers and their max throughput in m³/min (fluids &amp; gases).
          </p>
        </div>
        <dl className="text-right">
          <dt className="text-xs text-gray-500">Defined</dt>
          <dd className="font-mono text-lg text-ficsit">{count}</dd>
        </dl>
      </header>

      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-1 gap-4 overflow-y-auto lg:auto-rows-auto lg:grid-cols-[20rem_1fr] lg:overflow-visible">
        <div className="min-h-0 overflow-y-auto">
          <PipelineForm />
        </div>

        <div className="min-h-0 overflow-y-auto">
          {count === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
              No pipelines yet. Create one on the left.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pipelines.map((p, i) => (
                <PipelineCard key={p.id} pipeline={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
