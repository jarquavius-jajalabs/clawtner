import { useState, useEffect } from 'react';
import { Contact } from '../lib/types';
import * as api from '../lib/api';

const QUICK_CATEGORIES = [
  { value: 'good-morning', label: 'Good Morning', emoji: '☀️' },
  { value: 'love-note', label: 'Love Note', emoji: '💌' },
  { value: 'check-in', label: 'Check-in', emoji: '👋' },
  { value: 'reminder', label: 'Reminder', emoji: '📌' },
  { value: 'custom', label: 'Custom', emoji: '✏️' },
];

export default function Compose() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api.getContacts().then((res) => setContacts(res.contacts || []));
  }, []);

  function showToast(text: string, type: 'success' | 'error' = 'success') {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGenerate(cat: string) {
    if (!contactId) {
      showToast('Pick a contact first', 'error');
      return;
    }
    setCategory(cat);
    setGenerating(true);

    try {
      const res = await api.generateDraft(contactId, cat);
      if (res.message) {
        setMessage(res.message);
      } else if (res.error) {
        showToast(res.error, 'error');
      }
    } catch {
      showToast('Failed to generate', 'error');
    }
    setGenerating(false);
  }

  async function handleQueue() {
    if (!contactId || !message.trim()) return;
    setQueuing(true);
    try {
      await api.createDraft({ contact_id: contactId, message: message.trim(), category: category || 'custom' });
      showToast('Added to queue');
      setMessage('');
      setCategory('');
    } catch {
      showToast('Failed to queue', 'error');
    }
    setQueuing(false);
  }

  async function handleSendNow() {
    if (!contactId || !message.trim()) return;
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact?.phone) {
      showToast('Add a phone number first', 'error');
      return;
    }
    setSending(true);
    try {
      const res = await api.sendNow(contactId, message.trim(), category || 'custom');
      if (res.ok) {
        showToast('Sent!');
        setMessage('');
        setCategory('');
      } else {
        showToast(res.error || 'Send failed', 'error');
      }
    } catch {
      showToast('Send failed', 'error');
    }
    setSending(false);
  }

  const selectedContact = contacts.find((c) => c.id === contactId);

  return (
    <div className="compose">
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
          {toast.text}
        </div>
      )}

      <div className="compose-section">
        <label className="compose-label">To</label>
        <select
          className="compose-select"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
        >
          <option value="">Pick a contact...</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.phone ? '' : ' (no phone)'}</option>
          ))}
        </select>
      </div>

      {contactId && (
        <div className="compose-section">
          <label className="compose-label">Generate a message</label>
          <div className="compose-chips">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`compose-chip ${category === cat.value ? 'active' : ''}`}
                onClick={() => handleGenerate(cat.value)}
                disabled={generating}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {generating && (
        <div className="compose-generating">
          <div className="compose-spinner" />
          <span>Writing something nice...</span>
        </div>
      )}

      {(message || category === 'custom') && !generating && (
        <div className="compose-section">
          <label className="compose-label">Message</label>
          <textarea
            className="compose-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={category === 'custom' ? 'Write your message...' : 'Edit the generated message...'}
            rows={4}
          />
          <div className="compose-charcount">{message.length}/1000</div>
        </div>
      )}

      {message.trim() && (
        <div className="compose-actions">
          <button
            className="btn-primary compose-send-now"
            onClick={handleSendNow}
            disabled={sending || !selectedContact?.phone}
          >
            {sending ? 'Sending...' : 'Send Now'}
          </button>
          <button
            className="btn-secondary compose-queue"
            onClick={handleQueue}
            disabled={queuing}
          >
            {queuing ? 'Queuing...' : 'Add to Queue'}
          </button>
        </div>
      )}

      {message.trim() && selectedContact && !selectedContact.phone && (
        <div className="compose-warning">
          Add a phone number to {selectedContact.name} to send directly.
        </div>
      )}
    </div>
  );
}
