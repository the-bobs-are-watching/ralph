import type { ProjectInfo } from '../types'

interface ProjectCardProps {
  project: ProjectInfo
  isSelected: boolean
  onSelect: () => void
  onStart: () => void
  onStop: () => void
  onRemove: () => void
}

export function ProjectCard({
  project,
  isSelected,
  onSelect,
  onStart,
  onStop,
  onRemove,
}: ProjectCardProps) {
  const isRunning = project.status === 'running'
  const isComplete = project.status === 'complete'

  const statusColor = isRunning
    ? 'bg-amber-500'
    : isComplete
    ? 'bg-emerald-500'
    : 'bg-neutral-500'

  const statusText = isRunning
    ? `Iteration ${project.iteration || 0}/${project.maxIterations || 0}`
    : project.lastRun
    ? formatLastRun(project.lastRun)
    : 'Never run'

  const featureText =
    project.featuresTotal && project.featuresTotal > 0
      ? `${project.featuresCompleted}/${project.featuresTotal} features`
      : 'No features defined'

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? 'bg-neutral-800 ring-1 ring-neutral-600'
          : 'bg-neutral-900 hover:bg-neutral-850'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
            <h3 className="font-medium truncate">{project.name}</h3>
          </div>
          <p className="text-sm text-neutral-400 mt-1">{featureText}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{statusText}</p>
        </div>

        <div className="flex items-center gap-1">
          {isRunning ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStop()
              }}
              className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
              title="Stop"
            >
              <StopIcon />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStart()
              }}
              className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition-colors"
              title="Run"
            >
              <PlayIcon />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="p-2 rounded-lg hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Remove"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

function formatLastRun(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function PlayIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <rect x="4" y="4" width="12" height="12" rx="2" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  )
}
