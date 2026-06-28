/** Floor-related domain constants. Heights are in metres (game units). */

/** Default height applied to a newly created floor. */
export const DEFAULT_FLOOR_HEIGHT = 12

/** Allowed height range a user can set for a floor. */
export const MIN_FLOOR_HEIGHT = 1
export const MAX_FLOOR_HEIGHT = 64

/**
 * Visual scale: screen pixels per metre. User-adjustable at runtime (stored on
 * the floors slice); these are the default and the allowed range for the zoom.
 */
export const DEFAULT_PX_PER_METER = 11
export const MIN_PX_PER_METER = 2
export const MAX_PX_PER_METER = 40
export const PX_PER_METER_STEP = 1

/**
 * Floor-plan grid: snap resolution in metres for placing items along a floor
 * (the game's foundation grid is 8 m, with 1 m the finest standard step).
 * User-adjustable; positions snap to multiples of this.
 */
export const DEFAULT_GRID_SIZE = 1
export const MIN_GRID_SIZE = 0.25
export const MAX_GRID_SIZE = 8
export const GRID_SIZE_OPTIONS = [0.25, 0.5, 1, 2, 4, 8] as const
