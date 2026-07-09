import type { PersistedState, ProjectFile } from '@/app/persistence'

/** A short, human-readable tally of what a project file contains. */
export interface ProjectSummaryItem {
  label: string
  count: number
}

/** Count the notable entities in a project state for an at-a-glance preview. */
export function summarizeProject(data: PersistedState): ProjectSummaryItem[] {
  const placements = Object.values(data.placements.byFloor).reduce(
    (total, list) => total + list.length,
    0,
  )
  return [
    { label: 'Floors', count: data.floors.items.length },
    { label: 'Placements', count: placements },
    { label: 'Workbenches', count: data.workbenches.items.length },
    { label: 'Extractors', count: data.extractors.items.length },
    { label: 'Generators', count: data.generators.items.length },
    { label: 'Materials', count: data.materials.items.length },
    { label: 'Products', count: data.products.items.length },
    { label: 'Recipes', count: data.recipes.items.length },
  ]
}

/** Filename like `satisfactory-plan-2026-06-28.json` from an ISO timestamp. */
export function projectFileName(exportedAt: string): string {
  return `satisfactory-plan-${exportedAt.slice(0, 10)}.json`
}

/** Trigger a browser download of the project file as pretty-printed JSON. */
export function downloadProjectFile(file: ProjectFile): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = projectFileName(file.exportedAt)
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
