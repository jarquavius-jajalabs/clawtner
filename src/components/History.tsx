import { useState, useEffect } from 'react';
import { HistoryEntry } from '../lib/types';
import * as api from '../lib/api';

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
      {history.map((h) => (
        <div className="history-item" key={h.id}>
          <div className="history-header">
            <span className="contact-name">{h.contact_name || h.contact_id}</span>
            <span className="history-time">{timeAgo(h.created_at)}</span>
          </div>
          <p className="history-message">{h.message}</p>
        </div>
      ))}
    </div>
  );
}
