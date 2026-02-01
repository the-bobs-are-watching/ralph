import { useState, useEffect } from 'react'
import type { Prd, Feature } from '../types'

interface PrdEditorProps {
  projectId: string | null
  onUpdate: () => void
}

export function PrdEditor({ projectId, onUpdate }: PrdEditorProps) {
  const [prd, setPrd] = useState<Prd | null>(null)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [editingHeader, setEditingHeader] = useState(false)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadPrd()
    } else {
      setPrd(null)
    }
  }, [projectId])

  async function loadPrd() {
    if (!projectId) return
    const data = await window.ralph.getPrd(projectId)
    setPrd(data)
  }

  async function savePrd(updated: Prd) {
    if (!projectId) return
    await window.ralph.savePrd(projectId, updated)
    setPrd(updated)
    onUpdate()
  }

  function handleAddFeature() {
    const featureCount = prd?.features.length || 0
    const nextNum = String(featureCount + 1).padStart(3, '0')

    setEditingFeature({
      id: `F-${nextNum}`,
      category: 'backend',
      description: '',
      steps: [],
      priority: featureCount + 1,
      passes: false,
    })
    setIsNew(true)
  }

  function handleEditFeature(feature: Feature) {
    setEditingFeature({ ...feature, steps: [...(feature.steps || [])] })
    setIsNew(false)
  }

  function handleSaveFeature() {
    if (!prd || !editingFeature) return

    const cleanedFeature = {
      ...editingFeature,
      steps: editingFeature.steps.filter((s) => s.trim() !== ''),
    }

    let features: Feature[]
    if (isNew) {
      features = [...prd.features, cleanedFeature]
    } else {
      features = prd.features.map((f) =>
        f.id === cleanedFeature.id ? cleanedFeature : f
      )
    }

    savePrd({ ...prd, features })
    setEditingFeature(null)
  }

  function handleDeleteFeature(id: string) {
    if (!prd) return
    const features = prd.features.filter((f) => f.id !== id)
    savePrd({ ...prd, features })
  }

  function handleTogglePasses(feature: Feature) {
    if (!prd) return
    const features = prd.features.map((f) =>
      f.id === feature.id ? { ...f, passes: !f.passes } : f
    )
    savePrd({ ...prd, features })
  }

  function updateStep(index: number, value: string) {
    if (!editingFeature) return
    const steps = [...editingFeature.steps]
    steps[index] = value
    setEditingFeature({ ...editingFeature, steps })
  }

  function addStep() {
    if (!editingFeature) return
    setEditingFeature({
      ...editingFeature,
      steps: [...editingFeature.steps, ''],
    })
  }

  function removeStep(index: number) {
    if (!editingFeature) return
    const steps = editingFeature.steps.filter((_, i) => i !== index)
    setEditingFeature({ ...editingFeature, steps })
  }

  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        Select a project to view its PRD
      </div>
    )
  }

  if (!prd) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="font-medium">{prd.project}</h2>
              <code className="text-xs px-2 py-0.5 bg-neutral-800 rounded text-neutral-400">
                {prd.branchName}
              </code>
              <button
                onClick={() => setEditingHeader(true)}
                className="p-1 text-neutral-500 hover:text-neutral-300"
                title="Edit settings"
              >
                <PencilIcon />
              </button>
              <button
                onClick={loadPrd}
                className="p-1 text-neutral-500 hover:text-neutral-300"
                title="Refresh"
              >
                <RefreshIcon />
              </button>
            </div>
            {prd.notes?.constraints?.length > 0 && (
              <p className="text-xs text-neutral-500 mt-1">
                {prd.notes.constraints.join(' · ')}
              </p>
            )}
          </div>
          <button
            onClick={handleAddFeature}
            className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
          >
            + Add Feature
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {prd.features.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            No features yet. Click "Add Feature" to create one.
          </div>
        ) : (
          prd.features
            .sort((a, b) => a.priority - b.priority)
            .map((feature) => (
              <div
                key={feature.id}
                className={`p-4 rounded-xl border transition-colors ${
                  feature.passes
                    ? 'bg-emerald-950/30 border-emerald-800/50'
                    : 'bg-neutral-900 border-neutral-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleTogglePasses(feature)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      feature.passes
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'border-neutral-600 hover:border-neutral-500'
                    }`}
                  >
                    {feature.passes && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-neutral-500 font-mono">{feature.id}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400">
                        {feature.category}
                      </span>
                      <span className="text-xs text-neutral-600">P{feature.priority}</span>
                    </div>
                    <p className={`mt-1 ${feature.passes ? 'text-neutral-500 line-through' : ''}`}>
                      {feature.description}
                    </p>
                    {feature.steps && feature.steps.length > 0 && (
                      <div className="mt-2 text-xs text-neutral-500">
                        {feature.steps.length} step{feature.steps.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditFeature(feature)}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Edit Feature Modal */}
      {editingFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-700 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              {isNew ? 'Add Feature' : 'Edit Feature'}
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">ID</label>
                <input
                  type="text"
                  value={editingFeature.id}
                  onChange={(e) => setEditingFeature({ ...editingFeature, id: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-600"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Category</label>
                <input
                  type="text"
                  value={editingFeature.category}
                  onChange={(e) => setEditingFeature({ ...editingFeature, category: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-600"
                  placeholder="backend, frontend..."
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Priority</label>
                <input
                  type="number"
                  value={editingFeature.priority}
                  onChange={(e) => setEditingFeature({ ...editingFeature, priority: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Description</label>
              <textarea
                value={editingFeature.description}
                onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                rows={2}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-600 resize-none"
                placeholder="What should this feature do?"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-neutral-400">Steps</label>
                <button onClick={addStep} className="text-xs text-emerald-500 hover:text-emerald-400">
                  + Add Step
                </button>
              </div>
              <div className="space-y-2">
                {editingFeature.steps.map((step, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => updateStep(i, e.target.value)}
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-600"
                      placeholder={`Step ${i + 1}`}
                    />
                    <button onClick={() => removeStep(i)} className="p-2 text-neutral-500 hover:text-red-400">
                      <TrashIcon />
                    </button>
                  </div>
                ))}
                {editingFeature.steps.length === 0 && (
                  <p className="text-xs text-neutral-600">No steps - add specific implementation steps</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingFeature(null)}
                className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeature}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Header Modal */}
      {editingHeader && prd && (
        <HeaderEditor
          prd={prd}
          onSave={(updated) => {
            savePrd(updated)
            setEditingHeader(false)
          }}
          onCancel={() => setEditingHeader(false)}
        />
      )}
    </div>
  )
}

function HeaderEditor({ prd, onSave, onCancel }: { prd: Prd; onSave: (prd: Prd) => void; onCancel: () => void }) {
  const [project, setProject] = useState(prd.project)
  const [branchName, setBranchName] = useState(prd.branchName)
  const [constraints, setConstraints] = useState(prd.notes?.constraints?.join('\n') || '')
  const [dependencies, setDependencies] = useState(prd.notes?.dependencies?.join('\n') || '')
  const [outOfScope, setOutOfScope] = useState(prd.notes?.outOfScope?.join('\n') || '')

  function handleSave() {
    onSave({
      ...prd,
      project,
      branchName,
      notes: {
        constraints: constraints.split('\n').filter(s => s.trim()),
        dependencies: dependencies.split('\n').filter(s => s.trim()),
        outOfScope: outOfScope.split('\n').filter(s => s.trim()),
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-700 w-full max-w-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Edit PRD Settings</h3>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Project Name</label>
          <input
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Branch Name</label>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            placeholder="ralph/feature-name"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Constraints (one per line)</label>
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            rows={3}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-600 resize-none"
            placeholder="Python 3.12&#10;Must use existing API&#10;..."
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Dependencies (one per line)</label>
          <textarea
            value={dependencies}
            onChange={(e) => setDependencies(e.target.value)}
            rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-600 resize-none"
            placeholder="pytest&#10;httpx&#10;..."
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Out of Scope (one per line)</label>
          <textarea
            value={outOfScope}
            onChange={(e) => setOutOfScope(e.target.value)}
            rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-600 resize-none"
            placeholder="Frontend&#10;Database&#10;..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}
