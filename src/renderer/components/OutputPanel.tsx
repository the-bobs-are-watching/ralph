import { useEffect, useRef, useCallback } from 'react'

interface OutputLine {
  projectId: string
  text: string
  timestamp: number
}

interface OutputPanelProps {
  lines: OutputLine[]
}

export function OutputPanel({ lines }: OutputPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 50
    shouldAutoScroll.current = atBottom
  }, [])

  useEffect(() => {
    if (containerRef.current && shouldAutoScroll.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines])

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, padding: '8px 16px', borderBottom: '1px solid #262626', fontSize: '14px', color: '#a3a3a3' }}>
        Output
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'scroll',
          padding: '16px',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          maxHeight: '100%',
        }}
      >
        {lines.length === 0 ? (
          <div style={{ color: '#525252' }}>
            Output will appear here when you run a project...
          </div>
        ) : (
          lines.map((line, i) => (
            <div key={i} style={{ whiteSpace: 'pre-wrap', color: '#d4d4d4' }}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
