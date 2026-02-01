export interface ProjectInfo {
  id: string
  path: string
  name: string
  status: 'idle' | 'running' | 'complete'
  lastRun: string | null
  featuresCompleted?: number
  featuresTotal?: number
  iteration?: number
  maxIterations?: number
}

export interface LoopEvent {
  projectId: string
  event: string
  data: any
}

export interface Feature {
  id: string
  category: string
  description: string
  steps: string[]
  priority: number
  passes: boolean
}

export interface PrdNotes {
  constraints: string[]
  dependencies: string[]
  outOfScope: string[]
}

export interface Prd {
  project: string
  branchName: string
  features: Feature[]
  notes: PrdNotes
}

interface RalphAPI {
  getProjects: () => Promise<ProjectInfo[]>
  addProject: () => Promise<ProjectInfo | null>
  removeProject: (projectId: string) => Promise<ProjectInfo[]>
  startLoop: (projectId: string, maxIterations: number, useDocker: boolean) => Promise<boolean>
  stopLoop: (projectId: string) => Promise<boolean>
  onLoopEvent: (callback: (event: LoopEvent) => void) => () => void
  getPrd: (projectId: string) => Promise<Prd | null>
  savePrd: (projectId: string, prd: Prd) => Promise<boolean>
  getRalphFile: (projectId: string, filename: string) => Promise<string | null>
  saveRalphFile: (projectId: string, filename: string, content: string) => Promise<boolean>
  getProjectFile: (projectId: string, filename: string) => Promise<string | null>
  saveProjectFile: (projectId: string, filename: string, content: string) => Promise<boolean>
}

declare global {
  interface Window {
    ralph: RalphAPI
  }
}
