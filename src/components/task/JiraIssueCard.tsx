import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { JiraIssue } from '../../types'
import { PRIORITY_CONF } from '../../constants'
import { dlInfo } from '../../utils/dates'
import { prLabel, jiraLabel } from '../../utils/format'
import StatusSelect from '../ui/StatusSelect'

interface Props {
  issue: JiraIssue
  taskId: string
  index: number
  onStatusChange: (idx: number, status: JiraIssue['status']) => void
  onPriorityChange: (idx: number, priority: JiraIssue['priority']) => void
}

export default function JiraIssueCard({ issue, taskId, index, onStatusChange, onPriorityChange }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${taskId}-${index}`,
  })

  const pc = PRIORITY_CONF[issue.priority ?? 'low']
  const dl = issue.deadline ? dlInfo(issue.deadline, issue.deadlineTime) : null
  const jiraLbl = jiraLabel(issue.url)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    border: isDragging ? '2px dashed var(--accent)' : '1px solid var(--border)',
    background: 'var(--surface2)',
    borderRadius: 'var(--r)',
    padding: '8px 11px',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text3)', fontSize: 14, lineHeight: 1, padding: '2px 3px', borderRadius: 3, userSelect: 'none' }} title="Drag to reorder">⠿</span>
        <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
          {issue.name || jiraLbl || 'Jira Issue'}
        </div>
        <select
          value={issue.priority ?? 'low'}
          onChange={(e) => onPriorityChange(index, e.target.value as JiraIssue['priority'])}
          style={{ border: `1.5px solid ${pc.color}`, borderRadius: 10, fontSize: 10, fontWeight: 600, padding: '1px 6px', outline: 'none', cursor: 'pointer', background: 'transparent', color: pc.color, fontFamily: 'var(--mono)' }}
        >
          {Object.entries(PRIORITY_CONF).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {issue.url && (
          <a
            className="elink jira"
            href={issue.url}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 10 }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84zM6.77 6.8a4.362 4.362 0 0 0 4.34 4.34h1.79v1.71a4.362 4.362 0 0 0 4.34 4.34V7.63a.84.84 0 0 0-.83-.83zM2 11.6c0 2.4 1.95 4.34 4.35 4.34h1.78v1.72c.01 2.39 1.95 4.34 4.35 4.34v-9.57a.84.84 0 0 0-.84-.83z"/></svg>
            {jiraLbl ?? 'Jira'}
          </a>
        )}

        <StatusSelect
          value={issue.status}
          onChange={(v) => onStatusChange(index, v)}
          style={{ fontSize: 10, padding: '2px 20px 2px 8px' }}
        />

        {dl && dl.cls !== 'dl-none' && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10 }} className={dl.cls}>{dl.text}</span>
        )}
      </div>

      {/* PRs */}
      {issue.prs?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3, paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>PR/MR</span>
          {issue.prs.map((p, i) => {
            const lbl = prLabel(p.url)
            return lbl ? (
              <a key={i} className="elink" href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 10 }}>
                <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354Z"/></svg>
                {lbl}
              </a>
            ) : null
          })}
        </div>
      )}

      {/* comment */}
      {issue.comment && (
        <div style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic', paddingLeft: 2 }}>{issue.comment}</div>
      )}
    </div>
  )
}
