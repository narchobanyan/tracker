import { useState } from 'react'
import { useStore } from '../../store'
import { dlInfo, todayStr } from '../../utils/dates'
import { getJiras, jiraLabel, hexRgb, initials } from '../../utils/format'
import { STATUS_LABEL, STATUS_COLOR } from '../../constants'
import type { DeadlineItem } from '../../types'

type SortKey = 'urgency' | 'date-asc' | 'date-desc' | 'assignee' | 'project' | 'status'

export default function DeadlinesView() {
  const [sortKey, setSortKey] = useState<SortKey>('urgency')
  const { tasks, developers, projects, selectedProject, setSelectedDate, setView } = useStore()

  // Expand into deadline items — all non-done issues that have a deadline set
  const today = todayStr()
  const active: DeadlineItem[] = []
  tasks.forEach((task) => {
    if (selectedProject !== 'ALL' && task.projectId !== selectedProject) return
    const jiras = getJiras(task)
    if (jiras.length) {
      jiras.forEach((j, ji) => {
        if (j.deadline && j.status !== 'done') {
          active.push({ task, deadline: j.deadline, deadlineTime: j.deadlineTime ?? '', title: j.name || jiraLabel(j.url) || 'Issue', status: j.status, jiraUrl: j.url ?? '', taskDate: task.date, _key: `${task.id}-j${ji}`, _daysStuck: 0 })
        }
      })
    } else if (task.deadline && task.status !== 'done') {
      active.push({ task, deadline: task.deadline, deadlineTime: task.deadlineTime ?? '', title: task.title, status: task.status, jiraUrl: '', taskDate: task.date, _key: `${task.id}-task`, _daysStuck: 0 })
    }
  })

  // Deduplicate
  const seen = new Map<string, DeadlineItem>()
  const deduped: DeadlineItem[] = []
  active.forEach((item) => {
    const key = `${item.task.devId}|${item.title}|${item.deadline}`
    if (seen.has(key)) {
      const ex = seen.get(key)!
      if (item.taskDate < ex.taskDate) { ex.taskDate = item.taskDate; ex.task = item.task }
    } else {
      seen.set(key, item); deduped.push(item)
    }
  })
  deduped.forEach((item) => {
    item._daysStuck = Math.max(0, Math.round((new Date(today).getTime() - new Date(item.taskDate + 'T12:00:00').getTime()) / 86_400_000))
  })

  const dlDate = (item: DeadlineItem) => new Date(item.deadline + 'T' + (item.deadlineTime || '23:59'))
  const sorted = [...deduped]
  if (sortKey === 'date-asc' || sortKey === 'urgency') sorted.sort((a, b) => dlDate(a).getTime() - dlDate(b).getTime())
  else if (sortKey === 'date-desc') sorted.sort((a, b) => dlDate(b).getTime() - dlDate(a).getTime())
  else if (sortKey === 'assignee') sorted.sort((a, b) => (developers.find((d) => d.id === a.task.devId)?.name ?? '').localeCompare(developers.find((d) => d.id === b.task.devId)?.name ?? '') || dlDate(a).getTime() - dlDate(b).getTime())
  else if (sortKey === 'project') sorted.sort((a, b) => (projects.find((p) => p.id === a.task.projectId)?.name ?? '').localeCompare(projects.find((p) => p.id === b.task.projectId)?.name ?? '') || dlDate(a).getTime() - dlDate(b).getTime())
  else if (sortKey === 'status') { const o: Record<string, number> = { blocked: 0, inprogress: 1, review: 2, todo: 3 }; sorted.sort((a, b) => (o[a.status] ?? 3) - (o[b.status] ?? 3) || dlDate(a).getTime() - dlDate(b).getTime()) }

  const jumpTo = (item: DeadlineItem) => { setSelectedDate(item.task.date); setView('daily') }

  const Card = ({ item }: { item: DeadlineItem }) => {
    const { task, deadline, deadlineTime, title, status, jiraUrl, _daysStuck } = item
    const dev = developers.find((d) => d.id === task.devId)
    const proj = projects.find((p) => p.id === task.projectId)
    const d = dlInfo(deadline, deadlineTime)
    const rgb = dev ? hexRgb(dev.color) : '37,99,235'
    const devColor = dev?.color ?? '#2563eb'
    const cardCls = d.diff < 0 ? 'over' : d.diff === 0 ? 'today' : d.diff <= 7 ? 'soon' : 'ok'
    const borderColor = { over: 'var(--red)', today: 'var(--amber)', soon: '#f59e0b', ok: 'var(--green)' }[cardCls]
    const dlColor = { over: STATUS_COLOR.blocked, today: STATUS_COLOR.inprogress, soon: '#f59e0b', ok: STATUS_COLOR.done }[cardCls]

    return (
      <div onClick={() => jumpTo(item)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${borderColor}`, borderRadius: 'var(--rl)', padding: '12px 14px', marginBottom: 7, display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', transition: 'box-shadow .15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
            {title}
            {jiraUrl && (
              <a className="elink jira" href={jiraUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 10, marginLeft: 4 }}>{jiraLabel(jiraUrl) ?? jiraUrl.split('/').pop()}</a>
            )}
            {_daysStuck > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid #fca5a5', marginLeft: 6 }}>
                {_daysStuck === 1 ? 'since yesterday' : `${_daysStuck}d stuck`}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {dev && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className="av" style={{ background: `rgba(${rgb},.15)`, color: devColor, width: 18, height: 18, fontSize: 8, flexShrink: 0 }}>{initials(dev.name)}</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{dev.name}</span>
              </div>
            )}
            {proj && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '1px 6px', borderRadius: 3, background: proj.color + '18', color: proj.color }}>{proj.name}</span>}
            <span className={`spill s-${status}`} style={{ marginTop: 0 }}>{STATUS_LABEL[status]}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: dlColor }}>{d.text}</div>
          {deadlineTime && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{deadlineTime}</div>}
          <button onClick={(e) => { e.stopPropagation(); jumpTo(item) }} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>→ Go to task</button>
        </div>
      </div>
    )
  }

  const SORTS: [SortKey, string][] = [['urgency', '🔴 By urgency'], ['date-asc', '↑ Soonest'], ['date-desc', '↓ Latest'], ['assignee', '👤 Assignee'], ['project', '📁 Project'], ['status', '● Status']]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* sort bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.7px', marginRight: 2 }}>Sort:</span>
        {SORTS.map(([key, lbl]) => (
          <button key={key} onClick={() => setSortKey(key)} style={{ background: sortKey === key ? 'var(--accent-dim)' : 'var(--surface2)', border: `1px solid ${sortKey === key ? 'var(--accent)' : 'var(--border)'}`, color: sortKey === key ? 'var(--accent)' : 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 11px', borderRadius: 16, cursor: 'pointer', fontWeight: sortKey === key ? 600 : 400, transition: 'all .15s', whiteSpace: 'nowrap' }}>{lbl}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: 28, marginBottom: 9 }}>🎉</div>
            <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 3 }}>No open deadlines</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>Add Jira issues with deadlines to see them here</div>
          </div>
        ) : sortKey === 'urgency' ? (
          (() => {
            const groups: Record<string, DeadlineItem[]> = { '🔴 Overdue': [], '🟠 Today': [], '🟡 This week': [], '🔵 This month': [], '🟢 Later': [] }
            sorted.forEach((item) => {
              const d = dlInfo(item.deadline, item.deadlineTime)
              if (d.diff < 0) groups['🔴 Overdue'].push(item)
              else if (d.diff === 0) groups['🟠 Today'].push(item)
              else if (d.diff <= 7) groups['🟡 This week'].push(item)
              else if (d.diff <= 31) groups['🔵 This month'].push(item)
              else groups['🟢 Later'].push(item)
            })
            return Object.entries(groups).filter(([, items]) => items.length > 0).map(([label, items]) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0' }}>
                  {label} <span style={{ background: 'var(--surface3)', color: 'var(--text3)', padding: '1px 7px', borderRadius: 8, fontSize: 10 }}>{items.length}</span>
                </div>
                {items.map((item) => <Card key={item._key} item={item} />)}
              </div>
            ))
          })()
        ) : (
          sorted.map((item) => <Card key={item._key} item={item} />)
        )}
      </div>
    </div>
  )
}
