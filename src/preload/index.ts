import { contextBridge, ipcRenderer } from 'electron'

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

const api = {
  getProjects: (): Promise<ProjectInfo[]> => ipcRenderer.invoke('get-projects'),

  addProject: (): Promise<ProjectInfo | null> => ipcRenderer.invoke('add-project'),

  removeProject: (projectId: string): Promise<ProjectInfo[]> =>
    ipcRenderer.invoke('remove-project', projectId),

  startLoop: (
    projectId: string,
    maxIterations: number,
    useDocker: boolean
  ): Promise<boolean> =>
    ipcRenderer.invoke('start-loop', projectId, maxIterations, useDocker),

  stopLoop: (projectId: string): Promise<boolean> =>
    ipcRenderer.invoke('stop-loop', projectId),

  onLoopEvent: (callback: (event: LoopEvent) => void) => {
    const handler = (_: any, data: LoopEvent) => callback(data)
    ipcRenderer.on('loop-event', handler)
    return () => ipcRenderer.removeListener('loop-event', handler)
  },

  getPrd: (projectId: string): Promise<any> =>
    ipcRenderer.invoke('get-prd', projectId),

  savePrd: (projectId: string, prd: any): Promise<boolean> =>
    ipcRenderer.invoke('save-prd', projectId, prd),

  getRalphFile: (projectId: string, filename: string): Promise<string | null> =>
    ipcRenderer.invoke('get-ralph-file', projectId, filename),

  saveRalphFile: (projectId: string, filename: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('save-ralph-file', projectId, filename, content),

  getProjectFile: (projectId: string, filename: string): Promise<string | null> =>
    ipcRenderer.invoke('get-project-file', projectId, filename),

  saveProjectFile: (projectId: string, filename: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('save-project-file', projectId, filename, content),
}

contextBridge.exposeInMainWorld('ralph', api)

declare global {
  interface Window {
    ralph: typeof api
  }
}
