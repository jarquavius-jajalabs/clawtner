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

async function req(path: string, opts: RequestInit = {}): Promise<any> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Unauthorized');
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

// API Keys
export const getApiKeys = () => req('/auth/keys');
export const createApiKey = (name: string) => req('/auth/keys', { method: 'POST', body: JSON.stringify({ name }) });
