import { useState, useEffect } from 'react'

interface FileEditorProps {
  projectId: string | null
  filename: string
  title: string
}

export function FileEditor({ projectId, filename, title }: FileEditorProps) {
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [saving, setSaving] = useState(false)

  const hasChanges = content !== savedContent

  useEffect(() => {
    if (projectId) {
      loadFile()
    } else {
      setContent('')
      setSavedContent('')
    }
  }, [projectId, filename])

  async function loadFile() {
    if (!projectId) return
    const data = await window.ralph.getRalphFile(projectId, filename)
    setContent(data || '')
    setSavedContent(data || '')
  }

  async function saveFile() {
    if (!projectId) return
    setSaving(true)
    await window.ralph.saveRalphFile(projectId, filename, content)
    setSavedContent(content)
    setSaving(false)
  }

  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        Select a project to view {title.toLowerCase()}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <h2 className="font-medium">{title}</h2>
          {hasChanges && (
            <span className="text-xs text-amber-500">unsaved</span>
          )}
          <button
            onClick={loadFile}
            className="p-1 text-neutral-500 hover:text-neutral-300"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
        <button
          onClick={saveFile}
          disabled={!hasChanges || saving}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            hasChanges
              ? 'bg-emerald-600 hover:bg-emerald-500'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 p-4 bg-neutral-950 font-mono text-sm resize-none focus:outline-none"
        placeholder={`Enter ${title.toLowerCase()} content...`}
      />
    </div>
  )
}
