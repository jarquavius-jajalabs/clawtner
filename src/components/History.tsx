import { useState, useEffect } from 'react';
import { HistoryEntry, Contact } from '../lib/types';
import * as api from '../lib/api';

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  queued: { color: '#EAB308', label: 'Queued' },
  sent: { color: '#3B82F6', label: 'Sent' },
  delivered: { color: '#22C55E', label: 'Delivered' },
  failed: { color: '#EF4444', label: 'Failed' },
};

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterContact, setFilterContact] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([api.getHistory(100), api.getContacts()])
      .then(([h, c]) => {
        setHistory(h.history || []);
        setContacts(c.contacts || []);
      })
      .catch((e: any) => {
        if (e.name === 'OfflineError') {
          setError("You're offline. Pull to refresh.");
        } else {
          setError('Failed to load history.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function timeAgo(ts: number): string {
    const diff = Math.floor(Date.now() / 1000) - ts;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  if (loading) return (
    <div className="history">
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  );

  if (error) return (
    <div className="empty-state">
      <p>{error}</p>
      <button className="btn-primary" onClick={() => window.location.reload()} style={{ marginTop: 12 }}>Retry</button>
    </div>
  );

  if (history.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="var(--border)" strokeWidth="2"/>
            <path d="M14 24h20M24 14v20" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p>No messages sent yet</p>
        <span className="empty-sub">Approve messages from the Queue tab to start sending.</span>
      </div>
    );
  }

  // Get unique contact IDs from history
  const contactIds = [...new Set(history.map(h => h.contact_id))];
  const contactMap: Record<string, string> = {};
  contacts.forEach(c => { contactMap[c.id] = c.name; });

  const filtered = filterContact
    ? history.filter(h => h.contact_id === filterContact)
    : history;

  return (
    <div className="history">
      {/* Contact filter */}
      {contactIds.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterContact('')}
            style={{
              padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
              border: '1px solid',
              borderColor: !filterContact ? 'var(--text)' : 'var(--border)',
              background: !filterContact ? 'var(--text)' : 'transparent',
              color: !filterContact ? 'var(--bg)' : 'var(--text-3)',
              fontWeight: !filterContact ? 600 : 400,
            }}
          >
            All
          </button>
          {contactIds.map(cid => (
            <button
              key={cid}
              onClick={() => setFilterContact(cid === filterContact ? '' : cid)}
              style={{
                padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                border: '1px solid',
                borderColor: filterContact === cid ? 'var(--text)' : 'var(--border)',
                background: filterContact === cid ? 'var(--text)' : 'transparent',
                color: filterContact === cid ? 'var(--bg)' : 'var(--text-3)',
                fontWeight: filterContact === cid ? 600 : 400,
              }}
            >
              {contactMap[cid] || cid}
            </button>
          ))}
        </div>
      )}

      {filtered.map((h) => {
        const dot = STATUS_DOT[h.status] || STATUS_DOT.sent;
        return (
          <div className="history-item" key={h.id}>
            <div className="history-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Status dot */}
                <span
                  title={dot.label}
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: dot.color, flexShrink: 0,
                  }}
                />
                <span className="contact-name">{h.contact_name || contactMap[h.contact_id] || h.contact_id}</span>
              </div>
              <span className="history-time">{timeAgo(h.created_at)}</span>
            </div>
            <p className="history-message">{h.message}</p>
          </div>
        );
      })}

      {filtered.length === 0 && filterContact && (
        <div className="empty-state">
          <p>No messages for this contact yet.</p>
        </div>
      )}
    </div>
  );
}
