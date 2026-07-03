/** Shared port-layout primitives (positions, the grid editor). */
export { PortEditorToolbar } from './components/PortEditorToolbar'
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
export {
  DEFAULT_PORT_EDITOR_SETTINGS,
  portEditorChanged,
  type PortEditorPage,
  type PortEditorSettings,
} from './portEditorSlice'
export { default as portEditorReducer } from './portEditorSlice'
export type { PortPos } from './types'
