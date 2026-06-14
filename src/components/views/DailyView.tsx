import { useState } from 'react'
import { useStore, getVisibleDevIds, getVisibleTasks } from '../../store'
import { hexRgb, initials } from '../../utils/format'
import TaskCard from '../task/TaskCard'
import TaskForm from '../task/TaskForm'

interface Props {
  onToast: (msg: string) => void
}

export default function DailyView({ onToast }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [globalForm, setGlobalForm] = useState(false)
  const [formForDev, setFormForDev] = useState<string | null>(null)

  const state = useStore()
  const { developers, projects, selectedDev, selectedProject } = state
  const visibleIds = getVisibleDevIds(state)

  const proj = projects.find((p) => p.id === selectedProject)
  const titleParts = [
    selectedDev === 'ALL' ? 'All developers' : developers.find((d) => d.id === selectedDev)?.name ?? 'Developer',
    proj ? `· ${proj.name}` : '',
  ]

  const visibleDevs =
    selectedDev === 'ALL'
      ? developers.filter((d) => visibleIds.includes(d.id))
      : developers.filter((d) => d.id === selectedDev && visibleIds.includes(d.id))

  const cancelForm = () => { setEditingId(null); setGlobalForm(false); setFormForDev(null) }

  if (!visibleDevs.length) {
    return (
      <div style={{ textAlign: 'center', padding: '44px 20px', color: 'var(--text3)' }}>
        <div style={{ fontSize: 28, marginBottom: 9, opacity: 0.35 }}>◎</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 3 }}>No checkpoints here</div>
        <div style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>Add a developer first or select a different date</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px' }}>{titleParts.join(' ')}</span>
        <button
          onClick={() => { setGlobalForm(true); setEditingId(null); setFormForDev(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 11px', borderRadius: 6, cursor: 'pointer', transition: 'all .15s' }}
        >
          + Add checkpoint
        </button>
      </div>

      {globalForm && <TaskForm onCancel={cancelForm} />}

      {visibleDevs.map((dev) => {
        const rgb = hexRgb(dev.color)
        const devTasks = getVisibleTasks(state, dev.id)

        return (
          <div key={dev.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '7px 11px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
              <div className="av" style={{ background: `rgba(${rgb},.15)`, color: dev.color, width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>{initials(dev.name)}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{dev.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {dev.role}</span>
              <button
                onClick={() => { setFormForDev(dev.id); setGlobalForm(false); setEditingId(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: '1px dashed var(--border2)', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 9px', borderRadius: 5, cursor: 'pointer', marginLeft: 'auto', transition: 'all .15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}
              >
                + checkpoint
              </button>
            </div>

            {formForDev === dev.id && <TaskForm forDevId={dev.id} onCancel={cancelForm} />}

            {devTasks.length === 0 && formForDev !== dev.id && (
              <div style={{ padding: '7px 11px', color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--mono)' }}>
                No checkpoints — click + checkpoint to add
              </div>
            )}

            {devTasks.map((task) =>
              editingId === task.id ? (
                <TaskForm key={task.id} taskId={task.id} onCancel={cancelForm} />
              ) : (
                <TaskCard key={task.id} task={task} onEdit={() => setEditingId(task.id)} onToast={onToast} />
              ),
            )}
          </div>
        )
      })}
    </div>
  )
}
