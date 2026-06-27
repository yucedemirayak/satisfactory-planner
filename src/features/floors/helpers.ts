import type { Floor } from './types'

/**
 * Display label for a floor. Uses the user's custom name when set, otherwise
 * derives one from the floor's position from the bottom (0-based), so labels
 * renumber automatically when floors are inserted or removed.
 */
export const floorLabel = (floor: Floor, indexFromBottom: number): string =>
  floor.name.trim() || `Floor ${indexFromBottom + 1}`
