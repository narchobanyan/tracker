import { useState, useCallback } from 'react'
import { useStore } from '../../store'
import { STATUS_EMOJI, STATUS_LABEL } from '../../constants'
import { getJiras, jiraLabel } from '../../utils/format'
import { dlInfo } from '../../utils/dates'

type Format = 'slack' | 'markdown' | 'plain'

interface Props {
  onClose: () => void
}

export default function StandupModal({ onClose }: Props) {
  const [format, setFormat] = useState<Format>('slack')
  const [copied, setCopied] = useState(false)

  const { developers, projects, tasks, selectedDev, selectedProject, selectedDate } = useStore()

  const dateTasks = tasks.filter(
    (t) =>
      t.date === selectedDate &&
      (selectedProject === 'ALL' || t.projectId === selectedProject) &&
      (selectedDev === 'ALL' || t.devId === selectedDev),
  )

  const proj = projects.find((p) => p.id === selectedProject)

  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const isFiltered = selectedProject !== 'ALL'
  const projIds = [...new Set(dateTasks.map((t) => t.projectId || 'none'))]
  const multiProj = !isFiltered && projIds.length > 1

  const projGroups = projIds.map((pid) => ({
    proj: projects.find((p) => p.id === pid),
    groupTasks: dateTasks.filter((t) => (t.projectId || 'none') === pid),
  }))

  const buildBody = useCallback(() => {
    const lines: string[] = []

    function jiraLine(j: ReturnType<typeof getJiras>[0]): string {
      const name = j.name || jiraLabel(j.url) || 'Issue'
      const status = STATUS_LABEL[j.status ?? 'todo'] ?? j.status
      const dl = j.deadline ? dlInfo(j.deadline, j.deadlineTime).text : ''
      const cmt = j.comment?.trim() ?? ''

      if (format === 'slack') {
        const emoji = STATUS_EMOJI[j.status ?? 'todo'] ?? '📋'
        return `${emoji} *${name}* — ${status}${dl ? ` _(${dl})_` : ''}${cmt ? ` • _${cmt}_` : ''}`
      } else if (format === 'markdown') {
        return `- **${name}** — ${status}${dl ? ` _(${dl})_` : ''}${cmt ? ` • _${cmt}_` : ''}`
      } else {
        return `  • ${name} — ${status}${dl ? ` [${dl}]` : ''}${cmt ? ` (${cmt})` : ''}`
      }
    }

    function taskLine(t: (typeof dateTasks)[0]): string {
      const status = STATUS_LABEL[t.status ?? 'todo'] ?? t.status
      const cmt = t.comment?.trim() ?? ''
      if (format === 'slack') return `${STATUS_EMOJI[t.status ?? 'todo'] ?? '📋'} ${status}${cmt ? ` — ${cmt}` : ''}`
      if (format === 'markdown') return `- ${status}${cmt ? ` — ${cmt}` : ''}`
      return `  ${status}${cmt ? ` (${cmt})` : ''}`
    }

    if (format === 'slack') {
      lines.push(`*📋 Daily Standup — ${dateLabel}*${proj ? ` | ${proj.name}` : ''}`)
      lines.push('')
      projGroups.forEach(({ proj: pg, groupTasks }) => {
        if (multiProj) lines.push(`*${pg ? pg.name : 'No project'}*`)
        const indent = multiProj ? '  ' : ''
        const devsInGroup = developers.filter((d) => groupTasks.some((t) => t.devId === d.id))
        devsInGroup.forEach((dev) => {
          const dt = groupTasks.filter((t) => t.devId === dev.id)
          lines.push(`${indent}*${dev.name}* _(${dev.role})_`)
          dt.forEach((t) => {
            const jiras = getJiras(t)
            if (jiras.length) {
              jiras.forEach((j) => lines.push(`${indent}  ${jiraLine(j)}`))
            } else {
              lines.push(`${indent}  ${taskLine(t)}`)
            }
          })
        })
        lines.push('')
      })
    } else if (format === 'markdown') {
      lines.push(`# Daily Standup — ${dateLabel}${proj ? ` · ${proj.name}` : ''}`)
      lines.push('')
      projGroups.forEach(({ proj: pg, groupTasks }) => {
        if (multiProj) {
          lines.push(`## ${pg ? pg.name : 'No project'}`)
          lines.push('')
        }
        const devsInGroup = developers.filter((d) => groupTasks.some((t) => t.devId === d.id))
        devsInGroup.forEach((dev) => {
          const dt = groupTasks.filter((t) => t.devId === dev.id)
          lines.push(`${multiProj ? '###' : '##'} ${dev.name} (${dev.role})`)
          dt.forEach((t) => {
            const jiras = getJiras(t)
            if (jiras.length) {
              jiras.forEach((j) => lines.push(jiraLine(j)))
            } else {
              lines.push(taskLine(t))
            }
          })
          lines.push('')
        })
      })
    } else {
      lines.push(`DAILY STANDUP — ${dateLabel.toUpperCase()}${proj ? ` | ${proj.name}` : ''}`)
      lines.push('')
      projGroups.forEach(({ proj: pg, groupTasks }) => {
        if (multiProj) {
          lines.push(`[ ${pg ? pg.name : 'No project'} ]`)
          lines.push('='.repeat(34))
          lines.push('')
        }
        const devsInGroup = developers.filter((d) => groupTasks.some((t) => t.devId === d.id))
        devsInGroup.forEach((dev) => {
          const dt = groupTasks.filter((t) => t.devId === dev.id)
          lines.push(`${dev.name} (${dev.role})`)
          lines.push('-'.repeat(30))
          dt.forEach((t) => {
            const jiras = getJiras(t)
            if (jiras.length) {
              jiras.forEach((j) => lines.push(jiraLine(j)))
            } else {
              lines.push(taskLine(t))
            }
          })
          lines.push('')
        })
      })
    }

    return lines.join('\n')
  }, [dateTasks, developers, projects, format, dateLabel, proj, projGroups, multiProj, selectedProject])

  const body = buildBody()

  const copy = async () => {
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--rl)', width: '100%', maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>📢 Standup Export — {dateLabel}</span>
          <button onClick={onClose} className="icon-btn" style={{ fontSize: 16 }}>✕</button>
        </div>

        {/* format picker */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {(['slack', 'markdown', 'plain'] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 12px', borderRadius: 16, border: `1px solid ${format === f ? 'var(--accent)' : 'var(--border)'}`, background: format === f ? 'var(--accent-dim)' : 'var(--surface2)', color: format === f ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer', fontWeight: format === f ? 600 : 400 }}
            >
              {f === 'slack' ? '📨 Slack' : f === 'markdown' ? '📝 Markdown' : '📄 Plain text'}
            </button>
          ))}
        </div>

        {/* body */}
        {dateTasks.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontStyle: 'italic', fontSize: 13 }}>
            No checkpoints for this date.
          </div>
        ) : (
          <textarea
            readOnly
            value={body}
            style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.65, color: 'var(--text2)', background: 'var(--surface2)', resize: 'none', overflowY: 'auto' }}
          />
        )}

        {/* footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 18px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 12, padding: '6px 16px', borderRadius: 7, cursor: 'pointer' }}
          >
            Close
          </button>
          <button
            onClick={copy}
            disabled={dateTasks.length === 0}
            style={{ background: copied ? '#dcfce7' : 'var(--accent)', border: `1px solid ${copied ? '#86efac' : 'var(--accent)'}`, color: copied ? '#16a34a' : '#fff', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, padding: '6px 18px', borderRadius: 7, cursor: dateTasks.length === 0 ? 'not-allowed' : 'pointer', opacity: dateTasks.length === 0 ? 0.5 : 1, transition: 'all .2s' }}
          >
            {copied ? '✓ Copied!' : '⎘ Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
