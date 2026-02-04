import { useState, useEffect } from 'react'
import { ProjectCard } from './components/ProjectCard'
import { OutputPanel } from './components/OutputPanel'
import { PrdEditor } from './components/PrdEditor'
import { FileEditor } from './components/FileEditor'
import { ProjectFileEditor } from './components/ProjectFileEditor'
import { Settings } from './components/Settings'
import type { ProjectInfo, LoopEvent } from './types'

type Tab = 'output' | 'prd' | 'progress' | 'context'

interface OutputLine {
  projectId: string
  text: string
  timestamp: number
}

export default function App() {
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('prd')
  const [output, setOutput] = useState<OutputLine[]>([])
  const [useDocker, setUseDocker] = useState(false)
  const [maxIterations, setMaxIterations] = useState(1)

  useEffect(() => {
    loadProjects(true) // Auto-select first project on initial load

    const unsubscribe = window.ralph.onLoopEvent(handleLoopEvent)
    return unsubscribe
  }, [])

  async function loadProjects(autoSelect = false) {
    const loaded = await window.ralph.getProjects()
    setProjects(loaded)
    if (autoSelect && loaded.length > 0) {
      setSelectedProject(loaded[0].id)
    }
  }

  function handleLoopEvent(event: LoopEvent) {
    if (event.event === 'output') {
      setOutput((prev) => [
        ...prev,
        {
          projectId: event.projectId,
          text: event.data.text,
          timestamp: Date.now(),
        },
      ])
    }

    if (
      event.event === 'iteration-start' ||
      event.event === 'complete' ||
      event.event === 'end' ||
      event.event === 'error'
    ) {
      loadProjects()
    }

    if (event.event === 'iteration-start') {
      setOutput((prev) => [
        ...prev,
        {
          projectId: event.projectId,
          text: `\n━━━ Iteration ${event.data.iteration}/${event.data.maxIterations} ━━━\n`,
          timestamp: Date.now(),
        },
      ])
      setActiveTab('output')
    }

    if (event.event === 'complete') {
      setOutput((prev) => [
        ...prev,
        {
          projectId: event.projectId,
          text: `\n✓ PRD Complete!\n`,
          timestamp: Date.now(),
        },
      ])
    }
  }

  async function handleAddProject() {
    const project = await window.ralph.addProject()
    if (project) {
      await loadProjects()
      setSelectedProject(project.id)
      setActiveTab('prd')
    }
  }

  async function handleRemoveProject(projectId: string) {
    await window.ralph.removeProject(projectId)
    if (selectedProject === projectId) {
      setSelectedProject(null)
    }
    await loadProjects()
  }

  async function handleStartLoop(projectId: string) {
    setSelectedProject(projectId)
    setOutput([])
    setActiveTab('output')
    await window.ralph.startLoop(projectId, maxIterations, useDocker)
    await loadProjects()
  }

  async function handleStopLoop(projectId: string) {
    await window.ralph.stopLoop(projectId)
    await loadProjects()
  }

  const selectedOutput = output.filter(
    (o) => !selectedProject || o.projectId === selectedProject
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'prd', label: 'PRD' },
    { id: 'progress', label: 'Progress' },
    { id: 'context', label: 'Context' },
    { id: 'output', label: 'Output' },
  ]

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-3 pl-16">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <h1 className="text-lg font-semibold tracking-tight">Ralph</h1>
        </div>
        <button
          onClick={handleAddProject}
          className="px-4 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
        >
          + Add Project
        </button>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="w-80 border-r border-neutral-800 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <p>No projects yet</p>
                <p className="text-sm mt-1">Click "Add Project" to start</p>
              </div>
            ) : (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isSelected={selectedProject === project.id}
                  onSelect={() => setSelectedProject(project.id)}
                  onStart={() => handleStartLoop(project.id)}
                  onStop={() => handleStopLoop(project.id)}
                  onRemove={() => handleRemoveProject(project.id)}
                />
              ))
            )}
          </div>

          <Settings
            useDocker={useDocker}
            onUseDockerChange={setUseDocker}
            maxIterations={maxIterations}
            onMaxIterationsChange={setMaxIterations}
          />
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#0a0a0a' }}>
          <div className="flex border-b border-neutral-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-emerald-500'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'output' && (
            <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
              <OutputPanel lines={selectedOutput} />
            </div>
          )}
          {activeTab === 'prd' && (
            <div className="flex-1 relative min-h-0">
              <PrdEditor projectId={selectedProject} onUpdate={loadProjects} />
            </div>
          )}
          {activeTab === 'progress' && (
            <div className="flex-1 relative min-h-0">
              <FileEditor
                projectId={selectedProject}
                filename="progress/features.txt"
                title="Progress"
              />
            </div>
          )}
          {activeTab === 'context' && (
            <div className="flex-1 relative min-h-0">
              <ProjectFileEditor
                projectId={selectedProject}
                filename="CLAUDE.md"
                title="Context"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
