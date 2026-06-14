import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../../store'
import { PALETTE } from '../../constants'
import MembersModal from '../modals/MembersModal'

function Clock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  )
  useEffect(() => {
    const id = setInterval(
      () =>
        setTime(
          new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ),
      1000,
    )
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{time}</span>
}

function ProjectDropdown() {
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [membersModalProjId, setMembersModalProjId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const { projects, tasks, selectedProject, selectedDate, addProject, deleteProject, setSelectedProject } = useStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleAdd = () => {
    if (!name.trim()) return
    addProject({ name: name.trim(), desc: desc.trim(), color, members: [] })
    setName(''); setDesc(''); setShowForm(false)
  }

  const activeProj = projects.find((p) => p.id === selectedProject)

  return (
    <>
      <div ref={ref} style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '0 15px', height: '100%',
            borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
            minWidth: 190, userSelect: 'none', transition: 'background .15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
        >
          <div style={{ width: 10, height: 10, borderRadius: 3, background: activeProj?.color ?? 'var(--text3)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: activeProj ? 'var(--text)' : 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeProj?.name ?? 'All projects'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text3)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : '' }}>▾</span>
        </div>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 1px)', left: 0, minWidth: 290,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--rl)', boxShadow: 'var(--shadow)', zIndex: 400, overflow: 'hidden',
          }}>
            <div style={{ padding: '9px 13px 7px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px' }}>Projects</span>
              <button onClick={() => setShowForm((s) => !s)} style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 9px', borderRadius: 5, cursor: 'pointer' }}>+ New</button>
            </div>

            <div style={{ padding: 5, maxHeight: 320, overflowY: 'auto' }}>
              {/* All projects */}
              <div
                onClick={() => { setSelectedProject('ALL'); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 'var(--r)', cursor: 'pointer', transition: 'all .15s', border: '1px solid transparent', marginBottom: 2, background: selectedProject === 'ALL' ? 'var(--accent-dim)' : '', borderColor: selectedProject === 'ALL' ? 'var(--accent)' : 'transparent' }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--text3)', display: 'block', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: selectedProject === 'ALL' ? 'var(--accent)' : 'var(--text2)' }}>All projects</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: selectedProject === 'ALL' ? '#bfdbfe' : 'var(--surface3)', color: selectedProject === 'ALL' ? 'var(--accent)' : 'var(--text3)', padding: '1px 6px', borderRadius: 8 }}>
                  {tasks.filter((t) => t.date === selectedDate).length}
                </span>
              </div>

              {projects.length > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />}

              {projects.map((p) => {
                const cnt = tasks.filter((t) => t.projectId === p.id && t.date === selectedDate).length
                const isActive = selectedProject === p.id
                return (
                  <div key={p.id} style={{ marginBottom: 2 }}>
                    <div
                      onClick={() => { setSelectedProject(p.id); setOpen(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 'var(--r)', cursor: 'pointer', border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`, background: isActive ? 'var(--accent-dim)' : '', transition: 'all .15s' }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface2)' }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = '' }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        {p.desc && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.desc}</div>}
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{p.members.length} member{p.members.length !== 1 ? 's' : ''}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: isActive ? '#bfdbfe' : 'var(--surface3)', color: isActive ? 'var(--accent)' : 'var(--text3)', padding: '1px 6px', borderRadius: 8 }}>{cnt}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMembersModalProjId(p.id) }}
                        title="Edit members"
                        style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, padding: '2px 4px', cursor: 'pointer', transition: 'color .15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
                      >👥</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete project?')) deleteProject(p.id) }}
                        style={{ background: 'none', border: 'none', color: 'transparent', fontSize: 11, padding: '2px 4px', transition: 'all .15s', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'transparent')}
                      >✕</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {showForm && (
              <div style={{ padding: 9, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('proj-desc-input')?.focus() }} style={{ background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '5px 8px', borderRadius: 5, outline: 'none', width: '100%', fontSize: 12 }} />
                <input id="proj-desc-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }} style={{ background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '5px 8px', borderRadius: 5, outline: 'none', width: '100%', fontSize: 12 }} />
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {PALETTE.map((c) => (
                    <div key={c} onClick={() => setColor(c)} style={{ width: 19, height: 19, borderRadius: 4, background: c, cursor: 'pointer', border: `2px solid ${c === color ? '#1e293b' : 'transparent'}`, transform: c === color ? 'scale(1.2)' : '', transition: 'all .15s' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={handleAdd} style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 10, padding: 4, borderRadius: 5, border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', cursor: 'pointer' }}>Add</button>
                  <button onClick={() => setShowForm(false)} style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 10, padding: 4, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface3)', color: 'var(--text3)', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {membersModalProjId && (
        <MembersModal
          projectId={membersModalProjId}
          onClose={() => setMembersModalProjId(null)}
        />
      )}
    </>
  )
}

interface TopBarProps {
  onStandup: () => void
  urgentCount: number
  onJiraConfig: () => void
}

export default function TopBar({ onStandup, urgentCount, onJiraConfig }: TopBarProps) {
  const { exportJSON, importJSON, setNotifsEnabled, syncJira } = useStore()
  const jiraConfig = useStore((s) => s.jiraConfig)
  const [jiraSyncing, setJiraSyncing] = useState(false)

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          if (!confirm('Replace all current data?')) return
          importJSON(e.target!.result as string)
        } catch (err) {
          alert('Could not read file: ' + (err as Error).message)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const toggleNotifs = async () => {
    if (!('Notification' in window)) { alert('Notifications not supported in this browser'); return }
    if (Notification.permission === 'denied') {
      alert('Notifications are blocked. Go to browser Settings → Site settings → Notifications → allow this site.')
      return
    }
    const r = await Notification.requestPermission().catch(() => 'denied')
    if (r === 'granted') {
      setNotifsEnabled(true)
      new Notification('🔔 PM Tracker', { body: 'Notifications enabled — you will be alerted 15 min before deadlines' })
    } else {
      setNotifsEnabled(false)
    }
  }

  const handleJiraSync = useCallback(async () => {
    if (!jiraConfig.enabled || !jiraConfig.token) { onJiraConfig(); return }
    setJiraSyncing(true)
    try { await syncJira() } catch {}
    setJiraSyncing(false)
  }, [jiraConfig.enabled, jiraConfig.token, syncJira, onJiraConfig])

  const notifPerm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  const notifIcon = notifPerm === 'granted' ? '🔔' : '🔕'
  const notifOpacity = notifPerm === 'granted' ? 1 : 0.5

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 11,
    padding: '5px 11px', borderRadius: 6, transition: 'all .15s', whiteSpace: 'nowrap', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 300, height: 52, boxShadow: '0 1px 0 var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 15, color: 'var(--accent)', letterSpacing: '-.5px', paddingRight: 14, whiteSpace: 'nowrap' }}>
          pm<span style={{ color: 'var(--text3)' }}>/</span>tracker
        </span>
        <ProjectDropdown />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Clock />

        {/* deadline alert badge */}
        {urgentCount > 0 && (
          <span style={{ background: 'var(--red)', color: '#fff', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, animation: 'pulse 2s infinite' }}>
            ⏰ {urgentCount} urgent
          </span>
        )}

        <button onClick={toggleNotifs} title={notifPerm === 'granted' ? 'Notifications ON — click to test' : 'Enable notifications'} style={{ ...btnStyle, opacity: notifOpacity, padding: '5px 8px' }}>
          {notifIcon}
        </button>
        <button onClick={exportJSON} style={btnStyle}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Backup
        </button>
        <button onClick={handleImport} style={btnStyle}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 14 12 9 17 14"/><line x1="12" y1="9" x2="12" y2="21"/></svg>
          Restore
        </button>
        <button
          onClick={onJiraConfig}
          title="Jira settings"
          style={{ ...btnStyle, paddingRight: 6, borderRight: 'none', borderRadius: '6px 0 0 6px', borderColor: jiraConfig.enabled ? '#60a5fa' : 'var(--border)', color: jiraConfig.enabled ? '#60a5fa' : 'var(--text3)' }}
        >
          🔗 Jira
        </button>
        <button
          onClick={handleJiraSync}
          disabled={jiraSyncing}
          title="Sync from Jira"
          style={{ ...btnStyle, paddingLeft: 7, borderLeft: '1px solid var(--border)', borderRadius: '0 6px 6px 0', borderColor: jiraConfig.enabled ? '#60a5fa' : 'var(--border)', color: jiraConfig.enabled ? '#60a5fa' : 'var(--text3)', opacity: jiraSyncing ? 0.6 : 1 }}
        >
          {jiraSyncing ? '⟳' : '↻'}
        </button>
        <button onClick={onStandup} style={{ ...btnStyle, background: 'var(--green-dim)', borderColor: '#86efac', color: 'var(--green)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Standup
        </button>
      </div>
    </div>
  )
}
