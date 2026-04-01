const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('clawtner_token');
}

export function setToken(token: string) {
  localStorage.setItem('clawtner_token', token);
}

export function clearToken() {
  localStorage.removeItem('clawtner_token');
}

export function isAuthed(): boolean {
  return !!getToken();
}

export class OfflineError extends Error {
  constructor() {
    super("You're offline. Pull to refresh.");
    this.name = 'OfflineError';
  }
}

async function req(path: string, opts: RequestInit = {}): Promise<any> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
  } catch {
    throw new OfflineError();
  }
  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// Auth
export const login = (pin: string) => req('/auth/pin', { method: 'POST', body: JSON.stringify({ pin }) });

// Drafts
export const getDrafts = (status?: string) => req(`/drafts${status ? `?status=${status}` : ''}`);
export const approveDraft = (id: string, edited_message?: string) =>
  req(`/drafts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'approved', edited_message }) });
export const rejectDraft = (id: string) =>
  req(`/drafts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'rejected' }) });
export const deleteDraft = (id: string) => req(`/drafts/${id}`, { method: 'DELETE' });

// Contacts
export const getContacts = () => req('/contacts');
export const createContact = (data: any) => req('/contacts', { method: 'POST', body: JSON.stringify(data) });
export const updateContact = (id: string, data: any) =>
  req(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteContact = (id: string) => req(`/contacts/${id}`, { method: 'DELETE' });

// Gifts
export const getProducts = () => req('/gifts/products');
export const getDeliveryDates = () => req('/gifts/delivery-dates');
export const getGifts = (status?: string) => req(`/gifts${status ? `?status=${status}` : ''}`);
export const createGift = (data: any) => req('/gifts', { method: 'POST', body: JSON.stringify(data) });
export const approveGift = (id: string, payment_token: string) =>
  req(`/gifts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'approved', payment_token }) });
export const rejectGift = (id: string) =>
  req(`/gifts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'rejected' }) });

// History
export const getHistory = (limit?: number) => req(`/history${limit ? `?limit=${limit}` : ''}`);

// Channels
export const getChannels = () => req('/channels');
export const createChannel = (data: any) => req('/channels', { method: 'POST', body: JSON.stringify(data) });
export const updateChannel = (id: string, data: any) => req(`/channels/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteChannel = (id: string) => req(`/channels/${id}`, { method: 'DELETE' });
export const testChannel = (channel_id: string) => req('/channels/test', { method: 'POST', body: JSON.stringify({ channel_id }) });

// Feedback & Learning
export const createFeedback = (data: any) => req('/feedback', { method: 'POST', body: JSON.stringify(data) });
export const getFeedback = (contactId: string) => req(`/feedback?contact_id=${contactId}`);
export const getInsights = (contactId: string) => req(`/feedback/insights/${contactId}`);

// Cycles
export const getCycles = (contactId: string) => req(`/cycles?contact_id=${contactId}`);
export const createCycle = (data: any) => req('/cycles', { method: 'POST', body: JSON.stringify(data) });
export const updateCycle = (id: string, data: any) => req(`/cycles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// API Keys
export const getApiKeys = () => req('/auth/keys');
export const createApiKey = (name: string) => req('/auth/keys', { method: 'POST', body: JSON.stringify({ name }) });

// Schedules
export const getSchedules = (contactId?: string) => req(`/schedules${contactId ? `?contact_id=${contactId}` : ''}`);
export const createSchedule = (data: any) => req('/schedules', { method: 'POST', body: JSON.stringify(data) });
export const updateSchedule = (id: string, data: any) =>
  req(`/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSchedule = (id: string) => req(`/schedules/${id}`, { method: 'DELETE' });

// Contact Profile
export const getContactProfile = (contactId: string) => req(`/contacts/${contactId}/profile`);
export const addProfileField = (contactId: string, data: { category: string; key: string; value: string }) =>
  req(`/contacts/${contactId}/profile`, { method: 'POST', body: JSON.stringify(data) });
export const deleteProfileField = (contactId: string, category: string, key?: string) =>
  req(`/contacts/${contactId}/profile?category=${category}${key ? `&key=${key}` : ''}`, { method: 'DELETE' });

// Messages
export const sendMessage = (data: { draft_id?: string; contact_id?: string; message?: string }) =>
  req('/messages/send', { method: 'POST', body: JSON.stringify(data) });
