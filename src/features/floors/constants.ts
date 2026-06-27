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
