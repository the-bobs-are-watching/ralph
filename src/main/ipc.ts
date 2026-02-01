import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { runLoop, stopLoop, getRunningProjects } from './runner'
import { getMainWindow } from './index'

const PROJECTS_FILE = path.join(__dirname, '../../../projects.json')
const TEMPLATES_DIR = path.join(__dirname, '../../../templates/.ralph')

export interface Project {
  id: string
  path: string
  name: string
  status: 'idle' | 'running' | 'complete'
  lastRun: string | null
  iteration?: number
  maxIterations?: number
}

function loadProjects(): Project[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to load projects:', e)
  }
  return []
}

function saveProjects(projects: Project[]) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2))
}

function initRalphFolder(projectPath: string) {
  const ralphDir = path.join(projectPath, '.ralph')

  // Remove existing .ralph folder and recreate
  if (fs.existsSync(ralphDir)) {
    fs.rmSync(ralphDir, { recursive: true })
  }

  // Create minimal structure - just prd.json and progress/
  fs.mkdirSync(ralphDir, { recursive: true })
  fs.mkdirSync(path.join(ralphDir, 'progress'), { recursive: true })

  const projectName = path.basename(projectPath)
  const now = new Date().toISOString()

  // Create prd.json
  const prdTemplate = {
    project: projectName,
    branchName: `ralph/${projectName}`,
    features: [
      {
        id: 'F-001',
        category: 'feature',
        description: 'Describe what this feature should do',
        steps: [
          'Step 1: ...',
          'Step 2: ...'
        ],
        priority: 1,
        passes: false
      }
    ],
    notes: {
      constraints: [],
      dependencies: [],
      outOfScope: []
    }
  }
  fs.writeFileSync(path.join(ralphDir, 'prd.json'), JSON.stringify(prdTemplate, null, 2))

  // Create progress.txt
  fs.writeFileSync(
    path.join(ralphDir, 'progress', 'features.txt'),
    `# Progress - ${projectName}\n# Started: ${now}\n\n---\n\n`
  )
}

function getPrdStats(projectPath: string): { completed: number; total: number } {
  try {
    const prdPath = path.join(projectPath, '.ralph', 'prd.json')
    if (fs.existsSync(prdPath)) {
      const prd = JSON.parse(fs.readFileSync(prdPath, 'utf-8'))
      const features = prd.features || []
      const completed = features.filter((f: any) => f.passes === true).length
      return { completed, total: features.length }
    }
  } catch (e) {
    console.error('Failed to read PRD:', e)
  }
  return { completed: 0, total: 0 }
}

export function setupIpcHandlers() {
  ipcMain.handle('get-projects', () => {
    const projects = loadProjects()
    return projects.map((p) => {
      const stats = getPrdStats(p.path)
      const running = getRunningProjects()
      const runningInfo = running.get(p.id)
      return {
        ...p,
        featuresCompleted: stats.completed,
        featuresTotal: stats.total,
        status: runningInfo ? 'running' : p.status,
        iteration: runningInfo?.iteration,
        maxIterations: runningInfo?.maxIterations,
      }
    })
  })

  ipcMain.handle('add-project', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const projectPath = result.filePaths[0]
    const projectName = path.basename(projectPath)

    initRalphFolder(projectPath)

    const projects = loadProjects()
    const existing = projects.find((p) => p.path === projectPath)
    if (existing) {
      return existing
    }

    const newProject: Project = {
      id: Date.now().toString(),
      path: projectPath,
      name: projectName,
      status: 'idle',
      lastRun: null,
    }

    projects.push(newProject)
    saveProjects(projects)

    return newProject
  })

  ipcMain.handle('remove-project', (_, projectId: string) => {
    const projects = loadProjects()
    const filtered = projects.filter((p) => p.id !== projectId)
    saveProjects(filtered)
    return filtered
  })

  ipcMain.handle(
    'start-loop',
    async (_, projectId: string, maxIterations: number, useDocker: boolean) => {
      const projects = loadProjects()
      const project = projects.find((p) => p.id === projectId)
      if (!project) {
        throw new Error('Project not found')
      }

      project.status = 'running'
      project.lastRun = new Date().toISOString()
      saveProjects(projects)

      const mainWindow = getMainWindow()

      runLoop(project, maxIterations, useDocker, (event, data) => {
        mainWindow?.webContents.send('loop-event', { projectId, event, data })
      })

      return true
    }
  )

  ipcMain.handle('stop-loop', (_, projectId: string) => {
    stopLoop(projectId)
    const projects = loadProjects()
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      project.status = 'idle'
      saveProjects(projects)
    }
    return true
  })

  ipcMain.handle('get-prd', (_, projectId: string) => {
    const projects = loadProjects()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return null

    const prdPath = path.join(project.path, '.ralph', 'prd.json')
    try {
      if (fs.existsSync(prdPath)) {
        return JSON.parse(fs.readFileSync(prdPath, 'utf-8'))
      }
    } catch (e) {
      console.error('Failed to read PRD:', e)
    }
    return null
  })

  ipcMain.handle('save-prd', (_, projectId: string, prd: any) => {
    const projects = loadProjects()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return false

    const prdPath = path.join(project.path, '.ralph', 'prd.json')
    try {
      fs.writeFileSync(prdPath, JSON.stringify(prd, null, 2))
      return true
    } catch (e) {
      console.error('Failed to save PRD:', e)
      return false
    }
  })

  ipcMain.handle('get-ralph-file', (_, projectId: string, filename: string) => {
    const projects = loadProjects()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return null

    const filePath = path.join(project.path, '.ralph', filename)
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8')
      }
    } catch (e) {
      console.error('Failed to read file:', e)
    }
    return null
  })

  ipcMain.handle('save-ralph-file', (_, projectId: string, filename: string, content: string) => {
    const projects = loadProjects()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return false

    const filePath = path.join(project.path, '.ralph', filename)
    try {
      fs.writeFileSync(filePath, content)
      return true
    } catch (e) {
      console.error('Failed to save file:', e)
      return false
    }
  })

  ipcMain.handle('get-project-file', (_, projectId: string, filename: string) => {
    const projects = loadProjects()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return null

    const filePath = path.join(project.path, filename)
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8')
      }
    } catch (e) {
      console.error('Failed to read project file:', e)
    }
    return null
  })

  ipcMain.handle('save-project-file', (_, projectId: string, filename: string, content: string) => {
    const projects = loadProjects()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return false

    const filePath = path.join(project.path, filename)
    try {
      fs.writeFileSync(filePath, content)
      return true
    } catch (e) {
      console.error('Failed to save project file:', e)
      return false
    }
  })
}
