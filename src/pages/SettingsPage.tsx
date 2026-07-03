import { NavLink, Outlet } from 'react-router-dom'

import { PATHS } from '@/app/paths'

const TABS = [
  { to: PATHS.workbenches, label: 'Workbenches' },
  { to: PATHS.extractors, label: 'Extractors' },
  { to: PATHS.conveyors, label: 'Conveyors' },
  { to: PATHS.pipelines, label: 'Pipelines' },
  { to: PATHS.routing, label: 'Routing' },
  { to: PATHS.materials, label: 'Materials' },
  { to: PATHS.products, label: 'Products' },
  { to: PATHS.recipes, label: 'Recipes' },
] as const

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-ficsit/15 text-ficsit'
      : 'text-gray-400 hover:bg-surface-2 hover:text-gray-200'
  }`

/** Layout for the catalogue/configuration pages, reached via the header gear. */
export default function SettingsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <nav className="flex items-center gap-1 border-b border-edge pb-3">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={tabClass}>
            {tab.label}
          </NavLink>
        ))}
        <span className="mx-1 h-5 w-px bg-edge" aria-hidden />
        <NavLink to={PATHS.project} className={tabClass}>
          Data
        </NavLink>
      </nav>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
