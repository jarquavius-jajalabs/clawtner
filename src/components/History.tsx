import { useState, useEffect } from 'react';
import { HistoryEntry } from '../lib/types';
import * as api from '../lib/api';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  delivered: { bg: 'var(--green-soft)', color: 'var(--green)', label: 'Delivered' },
  sent: { bg: 'var(--green-soft)', color: 'var(--green)', label: 'Sent' },
  pending: { bg: 'var(--amber-soft)', color: 'var(--amber)', label: 'Pending' },
  failed: { bg: 'var(--accent-soft)', color: 'var(--accent)', label: 'Failed' },
};

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    api.getHistory(100).then((res) => setHistory(res.history || []));
  }, []);

  function timeAgo(ts: number): string {
    const diff = Math.floor(Date.now() / 1000) - ts;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  if (history.length === 0) {
    return <div className="empty-state"><p>No messages sent yet.</p></div>;
  }

  return (
    <div className="history">
      {history.map((h) => {
        const status = STATUS_STYLES[h.status] || STATUS_STYLES.sent;
        return (
          <div className="history-item" key={h.id}>
            <div className="history-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="contact-name">{h.contact_name || h.contact_id}</span>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 20,
                  background: status.bg, color: status.color,
                  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {status.label}
                </span>
              </div>
              <span className="history-time">{timeAgo(h.created_at)}</span>
            </div>
            <p className="history-message">{h.message}</p>
          </div>
        );
      })}
    </div>
  );
}
