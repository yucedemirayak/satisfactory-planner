/** Central route paths — avoid scattering magic strings across the app. */
export const PATHS = {
  floors: '/floors',
  production: '/production',
  // Everything below lives under the Settings layout (gear icon in the header).
  settings: '/settings',
  workbenches: '/settings/workbenches',
  extractors: '/settings/extractors',
  spacers: '/settings/spacers',
  conveyors: '/settings/conveyors',
  pipelines: '/settings/pipelines',
  routing: '/settings/routing',
  materials: '/settings/materials',
  products: '/settings/products',
  recipes: '/settings/recipes',
  project: '/settings/project',
} as const
