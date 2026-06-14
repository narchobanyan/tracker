import { useEffect, useState, useCallback, useRef } from 'react'
import { useStore, countUrgentDeadlines } from './store'
import { getJiras } from './utils/format'
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import Calendar from './components/calendar/Calendar'
import DailyView from './components/views/DailyView'
import DeadlinesView from './components/views/DeadlinesView'
import SearchView from './components/views/SearchView'
import PerformanceView from './components/views/PerformanceView'
import ScheduleView from './components/views/ScheduleView'
import StandupModal from './components/modals/StandupModal'
import JiraConfigModal from './components/modals/JiraConfigModal'

const VIEW_LABELS: Record<string, string> = {
  daily: '📅 Daily',
  deadlines: '⏰ Deadlines',
  search: '🔍 Search',
  performance: '📊 Performance',
  schedule: '🗓 Schedule',
}

// In-app alert notification component
interface InAppAlert { id: number; title: string; body: string }
function AlertStack({ alerts, onDismiss }: { alerts: InAppAlert[]; onDismiss: (id: number) => void }) {
  if (!alerts.length) return null
  return (
    <div style={{ position: 'fixed', top: 66, right: 16, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320, pointerEvents: 'none' }}>
      {alerts.map((a) => (
        <div key={a.id} onClick={() => onDismiss(a.id)} style={{ background: '#1e293b', color: '#fff', borderRadius: 12, padding: '14px 16px 12px', boxShadow: '0 8px 32px rgba(0,0,0,.45)', borderLeft: '4px solid #f59e0b', cursor: 'pointer', pointerEvents: 'all' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
          <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{a.body}</div>
          <div style={{ fontSize: 10, opacity: 0.3, marginTop: 6 }}>tap to dismiss</div>
        </div>
      ))}
    </div>
  )
}

const NOTIF_KEY = 'pmtracker_notified'
function loadNotified(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}') } catch { return {} }
}
function saveNotified(o: Record<string, number>) {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(o)) } catch {}
}

export default function App() {
  const { view, setView, selectedDate, selectedProject, projects, tasks, developers, autoCarryOverdue, syncJira } = useStore()
  const jiraConfig = useStore((s) => s.jiraConfig)
  const [toast, setToast] = useState<string | null>(null)
  const [standupOpen, setStandupOpen] = useState(false)
  const [jiraConfigOpen, setJiraConfigOpen] = useState(false)
  const [alerts, setAlerts] = useState<InAppAlert[]>([])
  const alertIdRef = useRef(0)
  const tasksRef = useRef(tasks)
  const developersRef = useRef(developers)
  useEffect(() => { tasksRef.current = tasks }, [tasks])
  useEffect(() => { developersRef.current = developers }, [developers])

  const urgentCount = countUrgentDeadlines(tasks)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const showInAppAlert = useCallback((title: string, body: string) => {
    const id = ++alertIdRef.current
    setAlerts((a) => [...a, { id, title, body }])
    // Play soft beep
    try {
      const ctx = new AudioContext()
      ;[[880, 0], [660, 0.15]].forEach(([freq, t]) => {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.value = freq
        g.gain.setValueAtTime(0.2, ctx.currentTime + t)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3)
      })
    } catch {}
    setTimeout(() => setAlerts((a) => a.filter((x) => x.id !== id)), 9000)
  }, [])

  // Check deadlines for 15-min notifications — uses refs so interval doesn't restart on every task mutation
  const checkDeadlineNotifications = useCallback(() => {
    const nowMs = Date.now()
    const notified = loadNotified()
    let changed = false

    tasksRef.current.forEach((task) => {
      const deadlines: { key: string; name: string; dl: string; t: string }[] = []
      const jiras = getJiras(task)
      jiras.forEach((j, ji) => {
        if (j.deadline && j.status !== 'done') {
          deadlines.push({ key: `${task.id}-j${ji}`, name: j.name || j.url.split('/').pop() || 'Issue', dl: j.deadline, t: j.deadlineTime || '' })
        }
      })
      if (!jiras.length && task.deadline && task.status !== 'done') {
        deadlines.push({ key: `${task.id}-task`, name: task.title || 'Checkpoint', dl: task.deadline, t: task.deadlineTime || '' })
      }

      deadlines.forEach(({ key, name, dl, t }) => {
        const nk = key + '-15'
        if (notified[nk]) return
        const [y, mo, d] = dl.split('-').map(Number)
        const [hh, mm] = (t || '23:59').split(':').map(Number)
        const dlMs = new Date(y, mo - 1, d, hh, mm, 0, 0).getTime()
        const diffMin = (dlMs - nowMs) / 60000
        if (diffMin > 14 && diffMin <= 16) {
          const dev = developersRef.current.find((dv) => dv.id === task.devId)
          showInAppAlert('⏰ 15 min until deadline!', `${name}\n${dev?.name ?? ''}${t ? ` · due at ${t}` : ''}`)
          if ('Notification' in window && Notification.permission === 'granted') {
            try { new Notification('⏰ 15 min until deadline!', { body: `${name} · ${dev?.name ?? ''}`, tag: nk }) } catch {}
          }
          notified[nk] = nowMs
          changed = true
        }
      })
    })
    if (changed) saveNotified(notified)
  }, [showInAppAlert])

  // auto carry overdue on mount
  useEffect(() => {
    const carried = autoCarryOverdue()
    if (carried) showToast('Overdue tasks carried over to today')
  }, [])

  // Escape closes modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setStandupOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Notification check interval
  useEffect(() => {
    checkDeadlineNotifications()
    const id = setInterval(checkDeadlineNotifications, 30000)
    return () => clearInterval(id)
  }, [checkDeadlineNotifications])

  // auto carry every minute in case day rolls over
  useEffect(() => {
    const id = setInterval(() => { if (autoCarryOverdue()) showToast('Overdue tasks carried over to today') }, 60000)
    return () => clearInterval(id)
  }, [])

  // Jira auto-poll
  useEffect(() => {
    if (!jiraConfig.enabled || !jiraConfig.syncInterval || !jiraConfig.token) return
    const ms = jiraConfig.syncInterval * 60 * 1000
    const id = setInterval(async () => {
      try {
        const { added, updated } = await syncJira()
        if (added || updated) showToast(`Jira synced — ${added} added, ${updated} updated`)
      } catch {}
    }, ms)
    return () => clearInterval(id)
  }, [jiraConfig.enabled, jiraConfig.syncInterval, jiraConfig.token])

  const proj = projects.find((p) => p.id === selectedProject)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <TopBar onStandup={() => setStandupOpen(true)} urgentCount={urgentCount} onJiraConfig={() => setJiraConfigOpen(true)} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* sidebar */}
        <Sidebar />

        {/* main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* view tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '8px 14px 0', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {(Object.keys(VIEW_LABELS) as Array<keyof typeof VIEW_LABELS>).map((v) => (
              <button
                key={v}
                onClick={() => setView(v as Parameters<typeof setView>[0])}
                style={{ position: 'relative', fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 14px', border: 'none', borderRadius: '6px 6px 0 0', background: view === v ? 'var(--bg)' : 'transparent', color: view === v ? 'var(--accent)' : 'var(--text3)', cursor: 'pointer', fontWeight: view === v ? 600 : 400, borderBottom: view === v ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all .15s' }}
              >
                {VIEW_LABELS[v]}
                {v === 'deadlines' && urgentCount > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--red)', color: '#fff', borderRadius: 8, fontSize: 8, fontWeight: 700, padding: '1px 4px', lineHeight: 1.4 }}>{urgentCount}</span>
                )}
              </button>
            ))}

            {/* date / project context chips */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6 }}>
              {view === 'daily' && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', padding: '2px 8px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  {selectedDate}
                </span>
              )}
              {proj && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 8, background: proj.color + '18', color: proj.color, border: `1px solid ${proj.color}40` }}>
                  {proj.name}
                </span>
              )}
            </div>
          </div>

          {/* calendar strip (only on daily view) */}
          {view === 'daily' && (
            <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
              <Calendar />
            </div>
          )}

          {/* view content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {view === 'daily' && <DailyView onToast={showToast} />}
            {view === 'deadlines' && <DeadlinesView />}
            {view === 'search' && <SearchView />}
            {view === 'performance' && <PerformanceView />}
            {view === 'schedule' && <ScheduleView />}
          </div>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--text)', color: 'var(--bg)', fontFamily: 'var(--mono)', fontSize: 12, padding: '9px 20px', borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,.3)', zIndex: 2000, pointerEvents: 'none' }}>
          {toast}
        </div>
      )}

      {/* in-app deadline alerts */}
      <AlertStack alerts={alerts} onDismiss={(id) => setAlerts((a) => a.filter((x) => x.id !== id))} />

      {/* standup modal */}
      {standupOpen && <StandupModal onClose={() => setStandupOpen(false)} />}

      {/* jira config modal */}
      {jiraConfigOpen && <JiraConfigModal onClose={() => setJiraConfigOpen(false)} />}
    </div>
  )
}
