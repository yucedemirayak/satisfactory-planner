/** Public surface of the placements feature. */
export { Palette } from './components/Palette'
export { FloorDropArea } from './components/FloorDropArea'
export { DragPreview } from './components/DragPreview'
export { MIN_BLOCK_PX } from './components/PlacedItem'
export { PlacementInspector } from './components/PlacementInspector'
export {
  default as placementsReducer,
  placementAdded,
  placementMoved,
  placementRemoved,
  placementQuantityChanged,
  placementRecipeChanged,
  placementMaterialChanged,
  placementPurityChanged,
  placementTierChanged,
  placementConfigAdded,
  placementConfigChanged,
  placementConfigRemoved,
} from './placementsSlice'
export { selectPlacementsByFloor, selectOverlappingPlacementIds } from './selectors'
export { placementFactors, extractorRate } from './calc'
export { selectProductionBalance } from './balance'
export type { ProductBalance } from './balance'
export { selectFactoryFootprint } from './footprint'
export type { FactoryFootprint } from './footprint'
export type { Placement, MachineConfig, Purity } from './types'
export type { DragData, DropData } from './dnd'
