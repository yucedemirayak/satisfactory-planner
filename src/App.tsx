import { NavLink, Navigate, Route, Routes } from 'react-router-dom'

import { PATHS } from '@/app/paths'
import FloorPlanPage from '@/pages/FloorPlanPage'
import ProductionPage from '@/pages/ProductionPage'
import SettingsPage from '@/pages/SettingsPage'
import { ConveyorManager } from '@/features/conveyors'
import { ExtractorManager } from '@/features/extractors'
import { MaterialManager } from '@/features/materials'
import { RoutingManager } from '@/features/nodes'
import { PipelineManager } from '@/features/pipelines'
import { ProductManager } from '@/features/products'
import { ProjectManager } from '@/features/project'
import { RecipeManager } from '@/features/recipes'
import { WorkbenchManager } from '@/features/workbenches'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-ficsit/15 text-ficsit'
      : 'text-gray-400 hover:bg-surface-2 hover:text-gray-200'
  }`

/** Gear icon — the only way into the Settings pages. */
function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function App() {
  return (
    <div className="flex h-screen flex-col bg-surface-0 text-gray-200">
      <header className="flex items-center gap-4 border-b border-edge bg-surface-1 px-4 py-3">
        <span className="text-lg font-black tracking-tight text-ficsit">
          ◆ FICSIT
        </span>
        <span className="text-sm text-gray-400">Megafactory Planner</span>
        <nav className="ml-6 flex items-center gap-1">
          <NavLink to={PATHS.floors} className={navLinkClass}>
            Floor Plan
          </NavLink>
          <NavLink to={PATHS.production} className={navLinkClass}>
            Production
          </NavLink>
        </nav>
        <NavLink
          to={PATHS.settings}
          title="Settings"
          aria-label="Settings"
          className={({ isActive }) =>
            `ml-auto rounded-md p-1.5 transition ${
              isActive
                ? 'bg-ficsit/15 text-ficsit'
                : 'text-gray-400 hover:bg-surface-2 hover:text-gray-200'
            }`
          }
        >
          <GearIcon />
        </NavLink>
      </header>

      <main className="min-h-0 flex-1 p-4">
        <Routes>
          <Route path="/" element={<Navigate to={PATHS.floors} replace />} />
          <Route path={PATHS.floors} element={<FloorPlanPage />} />
          <Route path={PATHS.production} element={<ProductionPage />} />
          <Route path={PATHS.settings} element={<SettingsPage />}>
            <Route
              index
              element={<Navigate to={PATHS.workbenches} replace />}
            />
            <Route path={PATHS.workbenches} element={<WorkbenchManager />} />
            <Route path={PATHS.extractors} element={<ExtractorManager />} />
            <Route path={PATHS.conveyors} element={<ConveyorManager />} />
            <Route path={PATHS.pipelines} element={<PipelineManager />} />
            <Route path={PATHS.routing} element={<RoutingManager />} />
            <Route path={PATHS.materials} element={<MaterialManager />} />
            <Route path={PATHS.products} element={<ProductManager />} />
            <Route path={PATHS.recipes} element={<RecipeManager />} />
            <Route path={PATHS.project} element={<ProjectManager />} />
          </Route>
          {/* Old top-level URLs (pre-settings) land back on the floor plan. */}
          <Route path="*" element={<Navigate to={PATHS.floors} replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
