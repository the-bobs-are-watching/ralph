interface SettingsProps {
  useDocker: boolean
  onUseDockerChange: (value: boolean) => void
  maxIterations: number
  onMaxIterationsChange: (value: number) => void
}

export function Settings({
  useDocker,
  onUseDockerChange,
  maxIterations,
  onMaxIterationsChange,
}: SettingsProps) {
  return (
    <div className="p-4 border-t border-neutral-800 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm text-neutral-400">Max iterations</label>
        <select
          value={maxIterations}
          onChange={(e) => onMaxIterationsChange(Number(e.target.value))}
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-600"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-neutral-400">Use Docker sandbox</label>
          <p className="text-xs text-neutral-600">Recommended for unattended runs</p>
        </div>
        <button
          onClick={() => onUseDockerChange(!useDocker)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            useDocker ? 'bg-emerald-600' : 'bg-neutral-700'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              useDocker ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
