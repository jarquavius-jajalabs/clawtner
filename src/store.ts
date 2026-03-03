import { Contact, Draft, CycleLog, HistoryItem } from './types'

// LocalStorage-backed store for MVP. Replace with D1 API later.

const KEYS = {
  contacts: 'clawtner_contacts',
  drafts: 'clawtner_drafts',
  cycleLogs: 'clawtner_cycle_logs',
  history: 'clawtner_history',
}

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// Contacts
export function getContacts(): Contact[] {
  return load<Contact>(KEYS.contacts)
}

export function addContact(c: Omit<Contact, 'id'>): Contact {
  const contacts = getContacts()
  const contact = { ...c, id: uid() }
  contacts.push(contact)
  save(KEYS.contacts, contacts)
  return contact
}

export function updateContact(id: string, updates: Partial<Contact>) {
  const contacts = getContacts()
  const idx = contacts.findIndex(c => c.id === id)
  if (idx >= 0) {
    contacts[idx] = { ...contacts[idx], ...updates }
    save(KEYS.contacts, contacts)
  }
}

export function deleteContact(id: string) {
  save(KEYS.contacts, getContacts().filter(c => c.id !== id))
}

// Drafts
export function getDrafts(status?: string): Draft[] {
  const all = load<Draft>(KEYS.drafts)
  return status ? all.filter(d => d.status === status) : all
}

export function addDraft(d: Omit<Draft, 'id' | 'created_at' | 'status'>): Draft {
  const drafts = load<Draft>(KEYS.drafts)
  const draft: Draft = { ...d, id: uid(), status: 'pending', created_at: Date.now() }
  drafts.unshift(draft)
  save(KEYS.drafts, drafts)
  return draft
}

export function updateDraft(id: string, updates: Partial<Draft>) {
  const drafts = load<Draft>(KEYS.drafts)
  const idx = drafts.findIndex(d => d.id === id)
  if (idx >= 0) {
    drafts[idx] = { ...drafts[idx], ...updates }
    save(KEYS.drafts, drafts)
  }
}

export function deleteDraft(id: string) {
  save(KEYS.drafts, load<Draft>(KEYS.drafts).filter(d => d.id !== id))
}

// Cycle logs
export function getCycleLogs(contactId: string): CycleLog[] {
  return load<CycleLog>(KEYS.cycleLogs).filter(l => l.contact_id === contactId)
}

export function addCycleLog(log: Omit<CycleLog, 'id'>): CycleLog {
  const logs = load<CycleLog>(KEYS.cycleLogs)
  const entry: CycleLog = { ...log, id: uid() }
  logs.unshift(entry)
  save(KEYS.cycleLogs, logs)
  return entry
}

// History
export function getHistory(contactId?: string): HistoryItem[] {
  const all = load<HistoryItem>(KEYS.history)
  return contactId ? all.filter(h => h.contact_id === contactId) : all
}

export function addToHistory(item: Omit<HistoryItem, 'id'>): HistoryItem {
  const history = load<HistoryItem>(KEYS.history)
  const entry: HistoryItem = { ...item, id: uid() }
  history.unshift(entry)
  save(KEYS.history, history)
  return entry
}

// Seed demo data
export function seedDemoData() {
  if (getContacts().length > 0) return

  const darcie = addContact({
    name: 'Darcie',
    phone: '+19517641875',
    relationship: 'wife',
    tone: 'warm, casual, loving',
    emoji: '💕',
    cycle_length: 28,
    period_length: 5,
    last_period_start: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    special_dates: [
      { name: 'Anniversary', date: '2024-06-15' },
      { name: 'Birthday', date: '1995-03-22' },
    ],
  })

  addDraft({
    contact_id: darcie.id,
    message: 'Hey babe, just thinking about you. Hope your day is going good so far.',
    category: 'love_note',
    metadata: { agent: 'openclaw', context: 'daily afternoon check-in' },
  })

  addDraft({
    contact_id: darcie.id,
    message: 'Want me to grab anything on the way home? I was thinking tacos tonight.',
    category: 'check_in',
    metadata: { agent: 'openclaw', context: 'evening plans' },
  })
}
