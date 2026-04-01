import { useState, useEffect } from 'react';
import { Contact, HistoryEntry } from '../lib/types';
import * as api from '../lib/api';
import CycleTracker from './CycleTracker';
import Learning from './Learning';
import SoulProfile from './SoulProfile';

const LOVE_LANGUAGES = [
  { id: 'words_of_affirmation', label: 'Words' },
  { id: 'acts_of_service', label: 'Acts of Service' },
  { id: 'gifts', label: 'Gifts' },
  { id: 'quality_time', label: 'Quality Time' },
  { id: 'physical_touch', label: 'Touch' },
];

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

export default function ContactDetail({
  contact: initialContact,
  onBack,
}: {
  contact: Contact;
  onBack: () => void;
}) {
  const [contact, setContact] = useState(initialContact);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tab, setTab] = useState<'messages' | 'cycle' | 'learning' | 'soul' | 'info'>('messages');

  useEffect(() => {
    fetch(`/api/history/${contact.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('clawtner_token')}` },
    })
      .then((r) => r.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {});
  }, [contact.id]);

  async function updateField(field: string, value: any) {
    await api.updateContact(contact.id, { [field]: value });
    setContact((c) => ({ ...c, [field]: value }));
  }

  const specialDates = contact.special_dates ? JSON.parse(contact.special_dates) : [];
  const prefs = contact.gift_preferences ? contact.gift_preferences : null;
  const escalationTopics = (contact.convo_mode_escalation || 'emotional,decisions,money').split(',').filter(Boolean);

  return (
    <div className="contact-detail">
      <button className="btn-back" onClick={onBack}>← Back</button>

      <div className="detail-header">
        <div className="detail-avatar">{contact.name.charAt(0).toUpperCase()}</div>
        <div className="detail-name-section">
          <h2>{contact.name}</h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
            {contact.relationship && <span className="badge">{contact.relationship}</span>}
            {contact.convo_mode === 1 && (
              <span className="badge" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
                Convo Mode
              </span>
            )}
          </div>
          {contact.phone && <div className="detail-sub">{contact.phone}</div>}
        </div>
      </div>

      {/* Love Language */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-label">Love Language</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {LOVE_LANGUAGES.map((ll) => (
            <button
              key={ll.id}
              onClick={() => updateField('love_language', ll.id === contact.love_language ? null : ll.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: contact.love_language === ll.id ? 'var(--text)' : 'var(--border)',
                background: contact.love_language === ll.id ? 'var(--text)' : 'transparent',
                color: contact.love_language === ll.id ? 'var(--bg)' : 'var(--text-3)',
                fontSize: 12,
                fontWeight: contact.love_language === ll.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {ll.label}
            </button>
          ))}
        </div>
        {contact.love_language && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Secondary</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {LOVE_LANGUAGES.filter((ll) => ll.id !== contact.love_language).map((ll) => (
                <button
                  key={ll.id}
                  onClick={() => updateField('love_language_secondary', ll.id === contact.love_language_secondary ? null : ll.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: contact.love_language_secondary === ll.id ? 'var(--text-2)' : 'var(--border)',
                    background: contact.love_language_secondary === ll.id ? 'var(--surface-2)' : 'transparent',
                    color: contact.love_language_secondary === ll.id ? 'var(--text)' : 'var(--text-3)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {ll.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Convo Mode */}
      {contact.relationship === 'partner' && (
        <div style={{ marginBottom: 16 }}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Convo Mode</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {contact.convo_mode === 1
                  ? 'Agent chats freely as you'
                  : 'Draft + approve only'}
              </div>
            </div>
            <button
              onClick={() => updateField('convo_mode', contact.convo_mode === 1 ? 0 : 1)}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                border: 'none',
                background: contact.convo_mode === 1 ? 'var(--green)' : 'var(--surface-2)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                background: 'white',
                position: 'absolute',
                top: 3,
                left: contact.convo_mode === 1 ? 23 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
          {contact.convo_mode === 1 && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
              Escalates to you on: {escalationTopics.map((t, i) => (
                <span key={t} className="badge" style={{ marginLeft: i === 0 ? 0 : 4, fontSize: 10 }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="detail-stats">
        <div className="stat">
          <div className="stat-num">{contact.total_sent || history.length}</div>
          <div className="stat-label">Sent</div>
        </div>
        <div className="stat">
          <div className="stat-num">{history.length > 0 ? timeAgo(history[0]?.created_at) : '—'}</div>
          <div className="stat-label">Last</div>
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
        <button className={`detail-tab ${tab === 'learning' ? 'active' : ''}`} onClick={() => setTab('learning')}>
          Learning
        </button>
        <button className={`detail-tab ${tab === 'soul' ? 'active' : ''}`} onClick={() => setTab('soul')}>
          Soul
        </button>
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
      {tab === 'learning' && <Learning contact={contact} />}

      {tab === 'soul' && <SoulProfile contactId={contact.id} />}

      {tab === 'info' && (
        <div className="detail-info">
          {contact.love_language && (
            <div className="info-block">
              <div className="info-label">Love Language</div>
              <div className="info-value">
                {LOVE_LANGUAGES.find((l) => l.id === contact.love_language)?.label || contact.love_language}
                {contact.love_language_secondary && (
                  <span style={{ color: 'var(--text-3)' }}>
                    {' / '}
                    {LOVE_LANGUAGES.find((l) => l.id === contact.love_language_secondary)?.label}
                  </span>
                )}
              </div>
            </div>
          )}
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
