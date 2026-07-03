/** Shared port-layout primitives (positions, the grid editor). */
export { PortGridEditor, type EditablePort } from './components/PortGridEditor'
export {
  cellCount,
  centerPorts,
  clamp01,
  edgePorts,
  portPosStyle,
  resolvePorts,
  snapToGrid,
} from './layout'
export type { PortPos } from './types'
