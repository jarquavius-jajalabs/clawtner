import { useState, useEffect } from 'react'
import { Tab, Contact, Draft } from './types'
import { getCycleDay, getCurrentPhase, formatCycleDay } from './cycle'
import CycleView from './CycleView'
import * as store from './store'

export default function App() {
  const [tab, setTab] = useState<Tab>('queue')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null)
  const [editText, setEditText] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  useEffect(() => {
    store.seedDemoData()
    reload()
  }, [])

  function reload() {
    setContacts(store.getContacts())
    setDrafts(store.getDrafts())
  }

  const pending = drafts.filter(d => d.status === 'pending')
  const history = store.getHistory()

  function approve(draft: Draft) {
    store.updateDraft(draft.id, { status: 'approved' })
    store.addToHistory({
      contact_id: draft.contact_id,
      message: draft.edited_message || draft.message,
      category: draft.category,
      sent_at: Date.now(),
    })
    reload()
  }

  function reject(id: string) {
    store.updateDraft(id, { status: 'rejected' })
    reload()
  }

  function saveEdit() {
    if (!editingDraft) return
    store.updateDraft(editingDraft.id, { edited_message: editText })
    setEditingDraft(null)
    reload()
  }

  function contactName(id: string): string {
    return contacts.find(c => c.id === id)?.name || 'Unknown'
  }

  function categoryBadge(cat: string) {
    const map: Record<string, string> = {
      love_note: 'badge-love',
      meal_plan: 'badge-meal',
      check_in: 'badge-checkin',
      reminder: 'badge-reminder',
    }
    const labels: Record<string, string> = {
      love_note: '💕 Love Note',
      meal_plan: '🍽️ Meal Plan',
      check_in: '👋 Check-in',
      reminder: '⏰ Reminder',
    }
    return <span className={`badge ${map[cat] || 'badge-checkin'}`}>{labels[cat] || cat}</span>
  }

  // Get primary contact for cycle view
  const cycleContact = selectedContact || contacts.find(c => c.last_period_start) || null

  return (
    <div className="app">
      {/* QUEUE TAB */}
      {tab === 'queue' && (
        <>
          <div className="header">
            <div>
              <h1>Clawtner</h1>
              <div className="header-sub">{pending.length} pending approval</div>
            </div>
          </div>

          {pending.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">✅</div>
              <div className="empty-text">All clear. No drafts waiting.</div>
            </div>
          ) : (
            pending.map(draft => (
              <div className="card" key={draft.id}>
                <div className="card-header">
                  {categoryBadge(draft.category)}
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                    → {contactName(draft.contact_id)}
                  </span>
                </div>
                <div className="card-message">
                  {draft.edited_message || draft.message}
                </div>
                <div className="card-meta">
                  <span>{draft.metadata?.agent || 'manual'}</span>
                  <span>{new Date(draft.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="card-actions">
                  <button className="btn btn-skip" onClick={() => reject(draft.id)}>Skip</button>
                  <button className="btn btn-edit" onClick={() => { setEditingDraft(draft); setEditText(draft.edited_message || draft.message) }}>Edit</button>
                  <button className="btn btn-approve" onClick={() => approve(draft)}>Send ✓</button>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* CYCLE TAB */}
      {tab === 'cycle' && (
        <>
          {cycleContact && cycleContact.last_period_start ? (
            <CycleView contact={cycleContact} onLog={() => setShowLogModal(true)} />
          ) : (
            <>
              <div className="header">
                <h1>Cycle</h1>
              </div>
              <div className="empty">
                <div className="empty-icon">🌙</div>
                <div className="empty-text">Add a contact with cycle info to start tracking</div>
              </div>
            </>
          )}
        </>
      )}

      {/* CONTACTS TAB */}
      {tab === 'contacts' && (
        <>
          <div className="header">
            <h1>Contacts</h1>
            <button
              onClick={() => setShowAddContact(true)}
              style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              + Add
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">👥</div>
              <div className="empty-text">No contacts yet</div>
            </div>
          ) : (
            contacts.map(c => (
              <div className="contact-row" key={c.id} onClick={() => setSelectedContact(c)}>
                <div className="contact-avatar">{c.emoji || '👤'}</div>
                <div className="contact-info">
                  <div className="contact-name">{c.name}</div>
                  <div className="contact-detail">
                    {c.relationship || 'Contact'} {c.phone ? `· ${c.phone}` : ''}
                  </div>
                  {c.last_period_start && (
                    <div className="contact-detail" style={{ color: getCurrentPhase(getCycleDay(c.last_period_start), c.cycle_length || 28).color }}>
                      {getCurrentPhase(getCycleDay(c.last_period_start), c.cycle_length || 28).emoji}{' '}
                      Day {formatCycleDay(getCycleDay(c.last_period_start), c.cycle_length || 28)} — {getCurrentPhase(getCycleDay(c.last_period_start), c.cycle_length || 28).name}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <>
          <div className="header">
            <h1>History</h1>
          </div>

          {history.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No messages sent yet</div>
            </div>
          ) : (
            history.map(h => (
              <div className="history-item" key={h.id}>
                <div className="history-msg">{h.message}</div>
                <div className="history-meta">
                  <span>→ {contactName(h.contact_id)}</span>
                  <span>{new Date(h.sent_at).toLocaleDateString()} {new Date(h.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* TAB BAR */}
      <div className="tab-bar">
        <button className={`tab ${tab === 'queue' ? 'active' : ''}`} onClick={() => setTab('queue')}>
          <span className="tab-icon">📨</span>
          Queue
          {pending.length > 0 && <span className="pending-count">{pending.length}</span>}
        </button>
        <button className={`tab ${tab === 'cycle' ? 'active' : ''}`} onClick={() => setTab('cycle')}>
          <span className="tab-icon">🌙</span>
          Cycle
        </button>
        <button className={`tab ${tab === 'contacts' ? 'active' : ''}`} onClick={() => setTab('contacts')}>
          <span className="tab-icon">👥</span>
          Contacts
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <span className="tab-icon">📋</span>
          History
        </button>
      </div>

      {/* EDIT MODAL */}
      {editingDraft && (
        <div className="modal-overlay" onClick={() => setEditingDraft(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingDraft(null)}>✕</button>
            <h2>Edit Message</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
              → {contactName(editingDraft.contact_id)}
            </p>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={5}
              autoFocus
            />
            <div className="card-actions" style={{ marginTop: 14 }}>
              <button className="btn btn-edit" onClick={() => setEditingDraft(null)}>Cancel</button>
              <button className="btn btn-approve" onClick={() => {
                store.updateDraft(editingDraft.id, { edited_message: editText })
                approve({ ...editingDraft, edited_message: editText })
                setEditingDraft(null)
              }}>Save & Send ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showAddContact && (
        <div className="modal-overlay" onClick={() => setShowAddContact(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddContact(false)}>✕</button>
            <h2>Add Contact</h2>
            <form onSubmit={e => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              store.addContact({
                name: f.get('name') as string,
                phone: f.get('phone') as string || undefined,
                relationship: f.get('relationship') as string || undefined,
                emoji: f.get('emoji') as string || '👤',
                tone: f.get('tone') as string || undefined,
                cycle_length: f.get('cycle_length') ? Number(f.get('cycle_length')) : undefined,
                period_length: f.get('period_length') ? Number(f.get('period_length')) : undefined,
                last_period_start: f.get('last_period_start') as string || undefined,
              })
              setShowAddContact(false)
              reload()
            }}>
              <label>Name *</label>
              <input type="text" name="name" required placeholder="Darcie" />

              <label>Phone</label>
              <input type="text" name="phone" placeholder="+1 555 123 4567" />

              <label>Relationship</label>
              <input type="text" name="relationship" placeholder="wife, girlfriend, mom..." />

              <label>Emoji</label>
              <input type="text" name="emoji" placeholder="💕" defaultValue="👤" />

              <label>Tone</label>
              <input type="text" name="tone" placeholder="warm, casual, funny..." />

              <div style={{ marginTop: 20, padding: '14px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>🌙 Cycle Tracking (optional)</div>
              </div>

              <label>Cycle Length (days)</label>
              <input type="number" name="cycle_length" placeholder="28" />

              <label>Period Length (days)</label>
              <input type="number" name="period_length" placeholder="5" />

              <label>Last Period Start Date</label>
              <input type="date" name="last_period_start" />

              <button type="submit" className="btn-primary">Add Contact</button>
            </form>
          </div>
        </div>
      )}

      {/* LOG MODAL */}
      {showLogModal && cycleContact && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogModal(false)}>✕</button>
            <h2>Log Period Start</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Mark the first day of {cycleContact.name}'s period to keep the tracker accurate.
            </p>
            <form onSubmit={e => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              const date = f.get('date') as string
              if (date) {
                store.updateContact(cycleContact.id, { last_period_start: date })
                store.addCycleLog({
                  contact_id: cycleContact.id,
                  date,
                  flow: 'medium',
                  mood: 'neutral',
                })
                setShowLogModal(false)
                reload()
              }
            }}>
              <label>Period Start Date</label>
              <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required />
              <button type="submit" className="btn-primary">Log It</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
