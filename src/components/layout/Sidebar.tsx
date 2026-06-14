import { useState } from 'react'
import { useStore, getVisibleDevIds, getVisibleTasks } from '../../store'
import { hexRgb, initials } from '../../utils/format'

export default function Sidebar() {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [color, setColor] = useState('#2563eb')

  const { developers, selectedDev, selectedProject, setSelectedDev, addDeveloper, removeDeveloper } = useStore()
  const state = useStore()
  const visibleIds = getVisibleDevIds(state)
  const visibleDevs = developers.filter((d) => visibleIds.includes(d.id))
  const totalCount = getVisibleTasks(state).length

  const handleAdd = () => {
    if (!name.trim()) return
    addDeveloper({ name: name.trim(), role: role.trim() || 'Developer', color })
    setName(''); setRole(''); setShowForm(false)
  }

  return (
    <div style={{ width: 215, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '11px 13px 8px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Developers
        <button onClick={() => setShowForm((s) => !s)} style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--accent)', fontSize: 14, width: 20, height: 20, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>+</button>
      </div>

      {/* All */}
      <div
        onClick={() => setSelectedDev('ALL')}
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 'var(--r)', cursor: 'pointer', border: `1px solid ${selectedDev === 'ALL' ? 'var(--accent)' : 'var(--border)'}`, background: selectedDev === 'ALL' ? 'var(--accent-dim)' : 'var(--surface2)', margin: '6px 6px 0', transition: 'all .15s' }}
      >
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>⚡</div>
        <span style={{ fontSize: 13, fontWeight: 500, color: selectedDev === 'ALL' ? 'var(--accent)' : 'var(--text2)', flex: 1 }}>All</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: selectedDev === 'ALL' ? '#bfdbfe' : 'var(--surface3)', color: selectedDev === 'ALL' ? 'var(--accent)' : 'var(--text3)', padding: '1px 5px', borderRadius: 8 }}>{totalCount}</span>
      </div>

      <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {selectedProject !== 'ALL' && visibleDevs.length === 0 ? (
          <div style={{ padding: '10px 13px', fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
            No members assigned.
          </div>
        ) : (
          visibleDevs.map((dev) => {
            const rgb = hexRgb(dev.color)
            const count = getVisibleTasks(state, dev.id).length
            const isActive = selectedDev === dev.id
            return (
              <div
                key={dev.id}
                onClick={() => setSelectedDev(dev.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 'var(--r)', cursor: 'pointer', border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`, background: isActive ? 'var(--accent-dim)' : '', transition: 'all .15s' }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent' } }}
              >
                <div className="av" style={{ background: `rgba(${rgb},.15)`, color: dev.color, width: 26, height: 26, fontSize: 10 }}>{initials(dev.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dev.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{dev.role}</div>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: isActive ? '#bfdbfe' : 'var(--surface3)', color: isActive ? 'var(--accent)' : 'var(--text3)', padding: '1px 5px', borderRadius: 8, flexShrink: 0 }}>{count}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Remove developer and their tasks?')) removeDeveloper(dev.id) }}
                  style={{ background: 'none', border: 'none', color: 'transparent', fontSize: 10, padding: 2, transition: 'all .15s', flexShrink: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'transparent')}
                >✕</button>
              </div>
            )
          })
        )}
      </div>

      {showForm && (
        <div style={{ padding: 8, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" onKeyDown={(e) => e.key === 'Enter' && document.getElementById('dev-role-input')?.focus()} style={{ background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '5px 8px', borderRadius: 5, outline: 'none', width: '100%', fontSize: 12 }} />
          <input id="dev-role-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Frontend)" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} style={{ background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '5px 8px', borderRadius: 5, outline: 'none', width: '100%', fontSize: 12 }} />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: 28, padding: '2px 4px', cursor: 'pointer', borderRadius: 5, border: '1px solid var(--border)', width: '100%' }} />
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={handleAdd} style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 10, padding: 4, borderRadius: 5, border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)' }}>Add</button>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 10, padding: 4, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface3)', color: 'var(--text3)' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
