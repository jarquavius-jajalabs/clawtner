export interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  relationship?: string
  tone?: string
  emoji?: string
  cycle_length?: number
  period_length?: number
  last_period_start?: string // YYYY-MM-DD
  special_dates?: { name: string; date: string }[]
}

export interface Draft {
  id: string
  contact_id: string
  message: string
  category: string
  status: 'pending' | 'approved' | 'rejected' | 'sent'
  suggested_time?: number
  edited_message?: string
  metadata?: { agent?: string; context?: string }
  created_at: number
}

export interface CycleLog {
  id: string
  contact_id: string
  date: string
  flow?: 'none' | 'light' | 'medium' | 'heavy'
  mood?: string
  energy?: string
  symptoms?: string[]
  notes?: string
}

export interface HistoryItem {
  id: string
  contact_id: string
  message: string
  category?: string
  sent_at: number
}

export type Tab = 'queue' | 'cycle' | 'contacts' | 'history'

export interface CyclePhase {
  name: string
  day_range: [number, number]
  color: string
  emoji: string
  description: string
  mood_tip: string
}
