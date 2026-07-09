import { Link } from 'react-router-dom'

import { useAppSelector } from '@/app/hooks'
import { PATHS } from '@/app/paths'
import { selectFloors } from '@/features/floors/selectors'
import { selectGenerators } from '@/features/generators'
import { selectPowerBalance, type PowerGroupRow } from '@/features/placements'
import { selectExtractors } from '@/features/extractors'
import { selectWorkbenches } from '@/features/workbenches/selectors'

const mw = (n: number) =>
  n.toLocaleString('en-US', { maximumFractionDigits: 1 })

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'emerald' | 'amber' | 'red' | 'gray'
}) {
  const tones = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-300',
    red: 'text-red-400',
    gray: 'text-gray-300',
  } as const
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-lg border border-edge bg-surface-1 p-4">
      <span className="text-xs tracking-wide text-gray-500 uppercase">
        {label}
      </span>
      <span className={`font-mono text-2xl font-semibold ${tones[tone]}`}>
        {value}
      </span>
    </div>
  )
}

function GroupTable({
  title,
  rows,
  total,
  nameOf,
  tone,
}: {
  title: string
  rows: PowerGroupRow[]
  total: number
  nameOf: (row: PowerGroupRow) => string
  tone: 'emerald' | 'amber'
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-edge bg-surface-1/50 p-4 text-sm text-gray-500">
          Nothing here yet.
        </p>
      ) : (
        <div className="overflow-auto rounded-lg border border-edge">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-surface-2 text-xs tracking-wide text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Building</th>
                <th className="px-4 py-2 text-right font-semibold">Machines</th>
                <th className="px-4 py-2 text-right font-semibold">MW</th>
                <th className="px-4 py-2 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.refId}
                  className="border-t border-edge bg-surface-1 odd:bg-surface-1/40"
                >
                  <td className="px-4 py-2 text-gray-200">{nameOf(r)}</td>
                  <td className="px-4 py-2 text-right font-mono text-gray-300">
                    {r.machines}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-mono ${tone === 'emerald' ? 'text-emerald-400' : 'text-amber-300'}`}
                  >
                    {mw(r.mw)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-500">
                    {total > 0 ? `${((r.mw / total) * 100).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Factory-wide power balance: generation vs consumption, with breakdowns. */
function EnergyPage() {
  const balance = useAppSelector(selectPowerBalance)
  const workbenches = useAppSelector(selectWorkbenches)
  const extractors = useAppSelector(selectExtractors)
  const generators = useAppSelector(selectGenerators)
  const floors = useAppSelector(selectFloors)

  const nameOf = (row: PowerGroupRow): string => {
    const items =
      row.kind === 'workbench'
        ? workbenches
        : row.kind === 'extractor'
          ? extractors
          : generators
    return items.find((i) => i.id === row.refId)?.name || 'Unknown'
  }
  const floorName = (id: string) => {
    const index = floors.findIndex((f) => f.id === id)
    const floor = floors[index]
    return floor?.name.trim() || `Floor ${index + 1}`
  }

  const empty = balance.production === 0 && balance.consumption === 0
  const deficit = balance.net < -1e-9

  return (
    <section className="flex h-full flex-col gap-4">
      <header>
        <h1 className="text-lg font-bold text-gray-100">Energy</h1>
        <p className="text-sm text-gray-500">
          Factory-wide power balance in MW — generators vs machines. Idle
          buildings (no recipe / material / fuel) draw nothing.
        </p>
      </header>

      {empty ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-edge bg-surface-1/50 p-10 text-center text-gray-400">
          No power flowing yet. Place machines and generators on the{' '}
          <Link to={PATHS.floors} className="text-ficsit hover:underline">
            Floor&nbsp;Plan
          </Link>
          .
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-3 sm:flex-row">
            <StatCard
              label="Production"
              value={`${mw(balance.production)} MW`}
              tone="emerald"
            />
            <StatCard
              label="Consumption"
              value={`${mw(balance.consumption)} MW`}
              tone="amber"
            />
            <StatCard
              label="Net"
              value={`${balance.net > 0 ? '+' : ''}${mw(balance.net)} MW`}
              tone={deficit ? 'red' : balance.net > 1e-9 ? 'emerald' : 'gray'}
            />
          </div>

          {deficit && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              ⚠ Not enough power — the grid would trip. Add generators or turn
              machines off.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <GroupTable
              title="Producers"
              rows={balance.producers}
              total={balance.production}
              nameOf={nameOf}
              tone="emerald"
            />
            <GroupTable
              title="Consumers"
              rows={balance.consumers}
              total={balance.consumption}
              nameOf={nameOf}
              tone="amber"
            />
          </div>

          {balance.byFloor.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-gray-300 uppercase">
                By floor
              </h2>
              <div className="overflow-auto rounded-lg border border-edge">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-surface-2 text-xs tracking-wide text-gray-400 uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Floor</th>
                      <th className="px-4 py-2 text-right font-semibold">
                        Production
                      </th>
                      <th className="px-4 py-2 text-right font-semibold">
                        Consumption
                      </th>
                      <th className="px-4 py-2 text-right font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.byFloor.map((f) => {
                      const net = f.production - f.consumption
                      return (
                        <tr
                          key={f.floorId}
                          className="border-t border-edge bg-surface-1 odd:bg-surface-1/40"
                        >
                          <td className="px-4 py-2 text-gray-200">
                            {floorName(f.floorId)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-emerald-400">
                            {mw(f.production)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-amber-300">
                            {mw(f.consumption)}
                          </td>
                          <td
                            className={`px-4 py-2 text-right font-mono font-semibold ${
                              net > 1e-9
                                ? 'text-emerald-400'
                                : net < -1e-9
                                  ? 'text-red-400'
                                  : 'text-gray-500'
                            }`}
                          >
                            {net > 0 ? '+' : ''}
                            {mw(net)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default EnergyPage
