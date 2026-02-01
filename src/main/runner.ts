import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { Project } from './ipc'

interface RunningProject {
  process: ChildProcess
  iteration: number
  maxIterations: number
  stopped: boolean
}

const runningProjects = new Map<string, RunningProject>()

function getPromptTemplate(): string {
  const isDev = !app.isPackaged
  const promptPath = isDev
    ? path.join(__dirname, '../../../src/prompts/loop.md')
    : path.join(process.resourcesPath, 'prompts/loop.md')

  try {
    return fs.readFileSync(promptPath, 'utf-8')
  } catch (err) {
    console.error('[runner] Failed to read prompt file:', promptPath, err)
    return 'Read .ralph/prd.json and implement ONE feature. Commit when done.'
  }
}

export function getRunningProjects() {
  return new Map(
    Array.from(runningProjects.entries()).map(([id, rp]) => [
      id,
      { iteration: rp.iteration, maxIterations: rp.maxIterations },
    ])
  )
}

export async function runLoop(
  project: Project,
  maxIterations: number,
  useDocker: boolean,
  onEvent: (event: string, data: any) => void
) {
  const runState: RunningProject = {
    process: null!,
    iteration: 0,
    maxIterations,
    stopped: false,
  }
  runningProjects.set(project.id, runState)

  console.log('[runner] Starting loop, maxIterations:', maxIterations)
  onEvent('start', { maxIterations })

  for (let i = 1; i <= maxIterations && !runState.stopped; i++) {
    runState.iteration = i
    console.log('[runner] Starting iteration', i)
    onEvent('iteration-start', { iteration: i, maxIterations })

    try {
      const result = await runIteration(project, useDocker, runState, onEvent)

      if (result.complete) {
        onEvent('complete', { iteration: i })
        break
      }

      if (i < maxIterations && !runState.stopped) {
        await sleep(2000)
      }
    } catch (error: any) {
      onEvent('error', { iteration: i, error: error.message })
      break
    }
  }

  runningProjects.delete(project.id)
  onEvent('end', { iteration: runState.iteration })
}

async function runIteration(
  project: Project,
  useDocker: boolean,
  runState: RunningProject,
  onEvent: (event: string, data: any) => void
): Promise<{ complete: boolean }> {
  return new Promise((resolve, reject) => {
    const prompt = getPromptTemplate()
    console.log('[runner] Prompt loaded, length:', prompt.length)

    let args: string[]
    let command: string

    if (useDocker) {
      command = 'docker'
      args = [
        'sandbox',
        'run',
        'claude',
        '--permission-mode',
        'acceptEdits',
        '-p',
        prompt,
      ]
    } else {
      command = 'claude'
      args = ['-p', prompt, '--permission-mode', 'bypassPermissions', '--output-format', 'stream-json', '--verbose']
    }

    console.log('[runner] Starting command:', command, args.slice(0, 4))
    console.log('[runner] cwd:', project.path)

    onEvent('output', { text: `> ${command} ${args.slice(0, 4).join(' ')} ...\n` })
    onEvent('output', { text: `> cwd: ${project.path}\n\n` })

    const proc = spawn(command, args, {
      cwd: project.path,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

    console.log('[runner] Process spawned, pid:', proc.pid)

    runState.process = proc

    let output = ''

    if (proc.stdout) {
      proc.stdout.setEncoding('utf8')
      let buffer = ''
      proc.stdout.on('data', (data: string) => {
        console.log('[runner] stdout chunk:', data.slice(0, 200))
        buffer += data
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const json = JSON.parse(line)
            output += line + '\n'

            // Extract text from various message types
            if (json.type === 'assistant' && json.message?.content) {
              for (const block of json.message.content) {
                if (block.type === 'text' && block.text) {
                  onEvent('output', { text: block.text })
                }
              }
            } else if (json.type === 'content_block_delta' && json.delta?.text) {
              onEvent('output', { text: json.delta.text })
            } else if (json.type === 'result' && json.result) {
              onEvent('output', { text: `\n[Result: ${json.result}]\n` })
            }
          } catch {
            // Not JSON, output as-is
            output += line + '\n'
            onEvent('output', { text: line + '\n' })
          }
        }
      })
    } else {
      console.log('[runner] No stdout!')
    }

    if (proc.stderr) {
      proc.stderr.setEncoding('utf8')
      proc.stderr.on('data', (data: string) => {
        console.log('[runner] stderr:', data.slice(0, 100))
        onEvent('output', { text: data })
      })
    } else {
      console.log('[runner] No stderr!')
    }

    proc.on('close', (code) => {
      console.log('[runner] Process closed with code:', code)
      onEvent('output', { text: `\n> Process exited with code ${code}\n` })

      if (runState.stopped) {
        resolve({ complete: false })
        return
      }

      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`))
        return
      }

      const complete = output.includes('<promise>COMPLETE</promise>')
      resolve({ complete })
    })

    proc.on('error', (err) => {
      console.log('[runner] Process error:', err.message)
      onEvent('output', { text: `\n> Error: ${err.message}\n` })
      reject(err)
    })
  })
}

export function stopLoop(projectId: string) {
  const runState = runningProjects.get(projectId)
  if (runState) {
    runState.stopped = true
    runState.process?.kill('SIGTERM')
    runningProjects.delete(projectId)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
