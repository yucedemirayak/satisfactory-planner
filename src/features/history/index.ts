/** Public surface of the history feature (floor-plan undo/redo). */
export { UndoRedoControl } from './components/UndoRedoControl'
export { MAX_HISTORY } from './constants'
export {
  applyPlanSnapshot,
  historyGroupKey,
  historyReducer,
  isUndoableAction,
  planChanged,
  planSnapshotOf,
  redo,
  undo,
} from './history'
export { selectCanRedo, selectCanUndo } from './selectors'
export type { HistoryState, PlanSnapshot } from './types'
