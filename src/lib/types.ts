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

export type Tab = 'queue' | 'contacts' | 'flowers' | 'history' | 'settings';
