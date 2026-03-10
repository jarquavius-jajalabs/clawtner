import { useState, useEffect } from 'react';
import { Contact, Insight, LearningStats } from '../lib/types';
import * as api from '../lib/api';

export default function Learning({ contact }: { contact: Contact }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);

  useEffect(() => {
    api.getInsights(contact.id).then((res: any) => {
      setInsights(res.insights || []);
      setStats(res.stats || null);
    });
  }, [contact.id]);

  const grouped = insights.reduce<Record<string, Insight[]>>((acc, i) => {
    (acc[i.insight_type] = acc[i.insight_type] || []).push(i);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    timing: 'Best Times',
    tone: 'Tone',
    topic: 'Topics That Land',
    length: 'Message Length',
    day_of_week: 'Best Days',
  };

  return (
    <div className="learning">
      {stats && stats.total > 0 ? (
        <>
          <div className="detail-stats">
            <div className="stat">
              <div className="stat-num">{stats.total}</div>
              <div className="stat-label">Messages</div>
            </div>
            <div className="stat">
              <div className="stat-num">{stats.approval_rate != null ? `${stats.approval_rate}%` : '—'}</div>
              <div className="stat-label">Hit Rate</div>
            </div>
            <div className="stat">
              <div className="stat-num">{stats.edit_rate != null ? `${stats.edit_rate}%` : '—'}</div>
              <div className="stat-label">Edit Rate</div>
            </div>
          </div>

          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} style={{ marginBottom: 12 }}>
              <div className="section-label">{typeLabels[type] || type}</div>
              {items.sort((a, b) => b.score - a.score).map((insight) => (
                <div className="card" key={insight.id} style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14 }}>{insight.insight_key}</span>
                    <span style={{
                      fontSize: 13,
                      color: insight.score > 0 ? 'var(--green)' : insight.score < 0 ? 'var(--accent)' : 'var(--text-3)',
                      fontWeight: 600,
                    }}>
                      {insight.score > 0 ? '+' : ''}{insight.score.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {insight.sample_count} sample{insight.sample_count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <div className="empty-mini">Feedback logged but no patterns detected yet</div>
          )}
        </>
      ) : (
        <div className="empty-mini">No learning data yet. Approve some messages to start building insights.</div>
      )}
    </div>
  );
}
