/**
 * Routing-node (splitter / merger) sizing. Dimensions are in metres; the on-
 * screen size is metres × px/m (like machines), floored at MIN_NODE_PX so a node
 * stays grabbable when zoomed out.
 */
export const MIN_NODE_PX = 16
export const DEFAULT_NODE_SIZE = { width: 2, height: 2 }
export const MIN_NODE_SIZE = 0.5
export const MAX_NODE_SIZE = 20
