import { createSelector } from '@reduxjs/toolkit'
import { useRef, useState } from 'react'

import { useAppDispatch, useAppSelector, useAppStore } from '@/app/hooks'
import { appStateImported } from '@/app/appActions'
import {
  getDefaultProject,
  parseProjectFile,
  serializeProject,
  type PersistedState,
} from '@/app/persistence'
import type { RootState } from '@/app/store'

import {
  downloadProjectFile,
  summarizeProject,
  type ProjectSummaryItem,
} from '../helpers'

/** A file parsed and validated, waiting for the user to confirm the overwrite. */
interface PendingImport {
  fileName: string
  data: PersistedState
  summary: ProjectSummaryItem[]
}

type Notice = { type: 'success' | 'error'; message: string } | null

/** Memoised so the live "current project" tally is reference-stable. */
const selectCurrentSummary = createSelector(
  (s: RootState) => s,
  (state) => summarizeProject(state),
)

/** A label + number tally, shared by the current and incoming previews. */
function SummaryGrid({ items }: { items: ProjectSummaryItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline justify-between gap-2 rounded-md bg-surface-2/60 px-2.5 py-1.5"
        >
          <dt className="truncate text-xs text-gray-400">{item.label}</dt>
          <dd className="font-mono text-sm text-gray-100">{item.count}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Settings page: export the whole project to a file, or import one back. */
export function ProjectManager() {
  const store = useAppStore()
  const dispatch = useAppDispatch()
  const currentSummary = useAppSelector(selectCurrentSummary)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [resetArmed, setResetArmed] = useState(false)

  const handleExport = () => {
    downloadProjectFile(serializeProject(store.getState()))
    setNotice({ type: 'success', message: 'Project exported.' })
  }

  const handleFilePicked = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    // Reset the input so picking the same file again still fires onChange.
    event.target.value = ''
    if (!file) return
    try {
      const data = parseProjectFile(await file.text())
      setPending({ fileName: file.name, data, summary: summarizeProject(data) })
      setNotice(null)
    } catch (error) {
      setPending(null)
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not read file.',
      })
    }
  }

  const confirmImport = () => {
    if (!pending) return
    dispatch(appStateImported(pending.data))
    setNotice({
      type: 'success',
      message: `Imported "${pending.fileName}".`,
    })
    setPending(null)
  }

  const confirmReset = () => {
    const data = getDefaultProject()
    setResetArmed(false)
    if (!data) {
      setNotice({ type: 'error', message: 'Default project is unavailable.' })
      return
    }
    dispatch(appStateImported(data))
    setNotice({ type: 'success', message: 'Reset to the default project.' })
  }

  return (
    <section className="flex h-full flex-col gap-4">
      <header>
        <h1 className="text-lg font-bold text-gray-100">Project Data</h1>
        <p className="text-sm text-gray-500">
          Back up your whole factory to a file, or restore it on another device.
        </p>
      </header>

      {notice && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            notice.type === 'success'
              ? 'border-ficsit/40 bg-ficsit/10 text-ficsit'
              : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-2">
        {/* Export */}
        <div className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4">
          <div>
            <h2 className="font-semibold text-gray-100">Export</h2>
            <p className="text-sm text-gray-500">
              Download everything below as a single JSON file.
            </p>
          </div>
          <SummaryGrid items={currentSummary} />
          <button
            type="button"
            onClick={handleExport}
            className="mt-auto rounded-md bg-ficsit px-3 py-2 text-sm font-semibold text-surface-0 transition hover:brightness-110"
          >
            Export project
          </button>
        </div>

        {/* Import */}
        <div className="flex flex-col gap-4 rounded-lg border border-edge bg-surface-1 p-4">
          <div>
            <h2 className="font-semibold text-gray-100">Import</h2>
            <p className="text-sm text-gray-500">
              Load a project file. This replaces your current project entirely.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFilePicked}
            className="hidden"
          />

          {pending ? (
            <div className="flex flex-col gap-3 rounded-md border border-ficsit/40 bg-surface-2/50 p-3">
              <p className="text-sm text-gray-300">
                Ready to import{' '}
                <span className="font-medium text-gray-100">
                  {pending.fileName}
                </span>
                :
              </p>
              <SummaryGrid items={pending.summary} />
              <p className="text-xs text-red-300">
                Your current project will be overwritten. This can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={confirmImport}
                  className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Replace my project
                </button>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="rounded-md border border-edge px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-surface-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-auto rounded-md border border-edge bg-surface-2 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:border-ficsit/50 hover:text-gray-100"
            >
              Choose file…
            </button>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-red-300">Reset to default</h2>
            <p className="text-sm text-gray-500">
              Restore the bundled catalogue and clear your floor plan — the
              first-run state. This can't be undone.
            </p>
          </div>
          {resetArmed ? (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={confirmReset}
                className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Yes, reset everything
              </button>
              <button
                type="button"
                onClick={() => setResetArmed(false)}
                className="rounded-md border border-edge px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-surface-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setResetArmed(true)}
              className="shrink-0 rounded-md border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/15"
            >
              Reset to default
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
