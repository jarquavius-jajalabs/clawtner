export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  channel: string;
  relationship?: string;
  tone?: string;
  preferences?: string;
  special_dates?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  gift_preferences?: string;
  love_language?: string;
  love_language_secondary?: string;
  convo_mode?: number;
  convo_mode_escalation?: string;
  created_at: number;
  updated_at: number;
  total_sent?: number;
}

export interface Draft {
  id: string;
  contact_id: string;
  message: string;
  category: string;
  status: string;
  suggested_time?: number;
  approved_at?: number;
  sent_at?: number;
  edited_message?: string;
  metadata?: string;
  created_at: number;
  updated_at: number;
}

export interface Gift {
  id: string;
  draft_id?: string;
  contact_id: string;
  provider: string;
  provider_order_id?: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  product_price?: number;
  delivery_date: string;
  message_card?: string;
  recipient_name?: string;
  recipient_address?: string;
  status: string;
  error?: string;
  metadata?: string;
  created_at: number;
  updated_at: number;
}

export interface FlowerProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

export interface HistoryEntry {
  id: string;
  draft_id?: string;
  contact_id: string;
  contact_name?: string;
  message: string;
  status: string;
  created_at: number;
}

export interface Feedback {
  id: string;
  draft_id?: string;
  contact_id: string;
  reaction: string;
  response_time?: number;
  original_message?: string;
  edited_message?: string;
  notes?: string;
  created_at: number;
}

export interface Insight {
  id: string;
  contact_id: string;
  insight_type: string;
  insight_key: string;
  score: number;
  sample_count: number;
  last_updated: number;
}

export interface LearningStats {
  total: number;
  thumbs_up: number;
  thumbs_down: number;
  edited: number;
  approval_rate: number | null;
  edit_rate: number | null;
  avg_response_time: number | null;
}

export interface Schedule {
  id: string;
  contact_id: string;
  name?: string;
  type: string;
  time: string;
  timezone: string;
  days_of_week?: string;
  day_of_month?: number;
  month_day?: string;
  category: string;
  prompt_context?: string;
  auto_approve: number;
  active: number;
  last_fired?: number;
  next_fire?: number;
  created_at: number;
  updated_at: number;
}

export interface ContactProfile {
  id: string;
  contact_id: string;
  category: string;
  key: string;
  value: string;
  created_at: number;
}

export interface MessageLog {
  id: string;
  history_id?: string;
  twilio_sid?: string;
  from_number?: string;
  to_number?: string;
  channel: string;
  status: string;
  error_code?: string;
  error_message?: string;
  price?: string;
  created_at: number;
  updated_at: number;
}

export type Tab = 'queue' | 'cycle' | 'schedule' | 'contacts' | 'flowers' | 'history' | 'settings';
