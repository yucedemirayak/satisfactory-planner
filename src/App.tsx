import { NavLink, Navigate, Route, Routes } from 'react-router-dom'

import { PATHS } from '@/app/paths'
import FloorPlanPage from '@/pages/FloorPlanPage'
import ProductionPage from '@/pages/ProductionPage'
import { ExtractorManager } from '@/features/extractors'
import { MaterialManager } from '@/features/materials'
import { ProductManager } from '@/features/products'
import { ProjectManager } from '@/features/project'
import { RecipeManager } from '@/features/recipes'
import { SpacerManager } from '@/features/spacers'
import { WorkbenchManager } from '@/features/workbenches'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-ficsit/15 text-ficsit'
      : 'text-gray-400 hover:bg-surface-2 hover:text-gray-200'
  }`

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
          <NavLink to={PATHS.workbenches} className={navLinkClass}>
            Workbenches
          </NavLink>
          <NavLink to={PATHS.extractors} className={navLinkClass}>
            Extractors
          </NavLink>
          <NavLink to={PATHS.spacers} className={navLinkClass}>
            Spacers
          </NavLink>
          <NavLink to={PATHS.materials} className={navLinkClass}>
            Materials
          </NavLink>
          <NavLink to={PATHS.products} className={navLinkClass}>
            Products
          </NavLink>
          <NavLink to={PATHS.recipes} className={navLinkClass}>
            Recipes
          </NavLink>
          <NavLink to={PATHS.production} className={navLinkClass}>
            Production
          </NavLink>
          <span className="mx-1 h-5 w-px bg-edge" aria-hidden />
          <NavLink to={PATHS.project} className={navLinkClass}>
            Data
          </NavLink>
        </nav>
      </header>

      <main className="min-h-0 flex-1 p-4">
        <Routes>
          <Route path="/" element={<Navigate to={PATHS.floors} replace />} />
          <Route path={PATHS.floors} element={<FloorPlanPage />} />
          <Route path={PATHS.workbenches} element={<WorkbenchManager />} />
          <Route path={PATHS.extractors} element={<ExtractorManager />} />
          <Route path={PATHS.spacers} element={<SpacerManager />} />
          <Route path={PATHS.materials} element={<MaterialManager />} />
          <Route path={PATHS.products} element={<ProductManager />} />
          <Route path={PATHS.recipes} element={<RecipeManager />} />
          <Route path={PATHS.production} element={<ProductionPage />} />
          <Route path={PATHS.project} element={<ProjectManager />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
