import { useState, useEffect } from 'react';
import { Contact, HistoryEntry } from '../lib/types';
import * as api from '../lib/api';
import CycleTracker from './CycleTracker';

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

export default function ContactDetail({
  contact,
  onBack,
}: {
  contact: Contact;
  onBack: () => void;
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tab, setTab] = useState<'messages' | 'cycle' | 'info'>('messages');

  useEffect(() => {
    // Fetch history for this contact
    fetch(`/api/history/${contact.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('clawtner_token')}` },
    })
      .then((r) => r.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {});
  }, [contact.id]);

  const specialDates = contact.special_dates ? JSON.parse(contact.special_dates) : [];
  const prefs = contact.gift_preferences ? contact.gift_preferences : null;

  return (
    <div className="contact-detail">
      <button className="btn-back" onClick={onBack}>← Back</button>

      <div className="detail-header">
        <div className="detail-avatar">
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <div className="detail-name-section">
          <h2>{contact.name}</h2>
          {contact.relationship && <span className="badge">{contact.relationship}</span>}
          {contact.phone && <div className="detail-sub">{contact.phone}</div>}
        </div>
      </div>

      <div className="detail-stats">
        <div className="stat">
          <div className="stat-num">{contact.total_sent || history.length}</div>
          <div className="stat-label">Messages Sent</div>
        </div>
        <div className="stat">
          <div className="stat-num">{history.length > 0 ? timeAgo(history[0]?.created_at) : '—'}</div>
          <div className="stat-label">Last Message</div>
        </div>
      </div>

      <div className="detail-tabs">
        <button className={`detail-tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>
          Messages
        </button>
        {contact.relationship === 'partner' && (
          <button className={`detail-tab ${tab === 'cycle' ? 'active' : ''}`} onClick={() => setTab('cycle')}>
            Cycle
          </button>
        )}
        <button className={`detail-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
          Info
        </button>
      </div>

      {tab === 'messages' && (
        <div className="detail-messages">
          {history.length === 0 ? (
            <div className="empty-mini">No messages sent yet</div>
          ) : (
            history.map((h) => (
              <div className="message-bubble" key={h.id}>
                <p>{h.message}</p>
                <span className="bubble-time">{timeAgo(h.created_at)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'cycle' && <CycleTracker contact={contact} />}

      {tab === 'info' && (
        <div className="detail-info">
          {contact.address_line1 && (
            <div className="info-block">
              <div className="info-label">Address</div>
              <div className="info-value">
                {contact.address_line1}
                {contact.address_line2 && <><br/>{contact.address_line2}</>}
                <br/>{contact.city}, {contact.state} {contact.zip}
              </div>
            </div>
          )}
          {contact.tone && (
            <div className="info-block">
              <div className="info-label">Tone</div>
              <div className="info-value">{contact.tone}</div>
            </div>
          )}
          {prefs && (
            <div className="info-block">
              <div className="info-label">Gift Preferences</div>
              <div className="info-value">{prefs}</div>
            </div>
          )}
          {specialDates.length > 0 && (
            <div className="info-block">
              <div className="info-label">Special Dates</div>
              {specialDates.map((d: any, i: number) => (
                <div className="info-value" key={i}>{d.name}: {d.date}</div>
              ))}
            </div>
          )}
          {contact.email && (
            <div className="info-block">
              <div className="info-label">Email</div>
              <div className="info-value">{contact.email}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
