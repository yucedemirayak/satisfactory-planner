/** What a placement points at: a workbench, extractor, generator, or spacer. */
export type PlacementKind = 'workbench' | 'spacer' | 'extractor' | 'generator'

/** Resource node purity (extractor-only). */
export type Purity = 'impure' | 'normal' | 'pure'

/**
 * A subset of a workbench placement's machines that share an overclock /
 * somersloop setup (e.g. "3 machines at 250% with 1 sloop"). Machines not in
 * any config run at base (100% clock, 0 sloops).
 */
export interface MachineConfig {
  id: string
  /** How many of the placement's machines use this setup. */
  count: number
  /** Clock percentage (100 = 1×), raised with power shards up to 250. */
  clock: number
  /** Somersloops per machine (0..the workbench's sloopSlots). */
  sloops: number
}

/**
 * An item placed on a floor — either a workbench instance or a spacer. Floors
 * hold an ordered list of these (left→right sequence). `refId` references the
 * matching catalogue (workbenches or spacers) by `kind`.
 */
export interface Placement {
  /** Stable unique instance id (also the dnd-kit sortable item id). */
  id: string
  kind: PlacementKind
  /** Ref to a Workbench or Spacer definition, per `kind`. */
  refId: string
  /** Left-edge position along the floor, in metres (snapped to the grid). */
  x: number
  /**
   * How many of this item are placed here (shown as "×N" in the floor plan).
   * Informational for now — it does not change the 2D footprint. Workbench-only.
   */
  quantity: number
  /** Assigned recipe (workbench-only), or null. Refs a Recipe by id. */
  recipeId: string | null
  /**
   * Overclock/somersloop setups applied to subsets of the machines. The rest
   * (quantity − Σ count) run at base. Used by workbenches & extractors.
   */
  configs: MachineConfig[]
  /** Extractor-only: which material it extracts (Material id), or null. */
  materialId: string | null
  /**
   * Node purity. Extractors scale their extraction rate by it; fuel-less
   * generators (geothermal) scale their power output by it.
   */
  purity: Purity
  /** Extractor-only: miner tier (1 = Mk.1, 2 = Mk.2, 3 = Mk.3). */
  tier: number
  /** Generator-only: which of its fuels this placement burns, or null. */
  fuelId: string | null
}
