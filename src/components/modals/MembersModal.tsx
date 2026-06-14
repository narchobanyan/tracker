import { useStore } from '../../store'
import { hexRgb, initials } from '../../utils/format'

interface Props {
  projectId: string
  onClose: () => void
}

export default function MembersModal({ projectId, onClose }: Props) {
  const { developers, projects, toggleMember } = useStore()
  const project = projects.find((p) => p.id === projectId)
  if (!project) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--rl)', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Project Members</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{project.name}</div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {developers.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No developers added yet</div>
          ) : (
            developers.map((dev) => {
              const rgb = hexRgb(dev.color)
              const isMember = project.members.includes(dev.id)
              return (
                <div key={dev.id} onClick={() => toggleMember(projectId, dev.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--r)', border: `1px solid ${isMember ? 'var(--accent)' : 'var(--border)'}`, background: isMember ? 'var(--accent-dim)' : 'var(--surface2)', cursor: 'pointer', transition: 'all .15s' }}>
                  <div className="av" style={{ background: `rgba(${rgb},.15)`, color: dev.color, width: 28, height: 28, fontSize: 10, flexShrink: 0 }}>{initials(dev.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{dev.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{dev.role}</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isMember ? 'var(--accent)' : 'var(--border)'}`, background: isMember ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                    {isMember && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, padding: '6px 18px', borderRadius: 7, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  )
}
