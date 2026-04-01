import { useState, useEffect } from 'react';
import { Contact, HistoryEntry } from '../lib/types';

interface AnalyticsData {
  totalSent: number;
  messagesPerWeek: number;
  streak: number;
  lastContacted: string;
  categoryBreakdown: Record<string, number>;
  weeklyActivity: number[];
  score: number;
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

function computeAnalytics(history: HistoryEntry[]): AnalyticsData {
  const totalSent = history.length;
  const now = Date.now() / 1000;

  // Messages per week (over last 4 weeks)
  const fourWeeksAgo = now - 28 * 86400;
  const recentMessages = history.filter((h) => h.created_at >= fourWeeksAgo);
  const messagesPerWeek = recentMessages.length > 0 ? Math.round((recentMessages.length / 4) * 10) / 10 : 0;

  // Streak: count consecutive weeks with at least 1 message going backwards
  let streak = 0;
  if (history.length > 0) {
    const weekMs = 7 * 86400;
    let weekStart = Math.floor(now / weekMs) * weekMs;
    // Check each week going back
    for (let w = 0; w < 52; w++) {
      const weekEnd = weekStart;
      const weekBegin = weekStart - weekMs;
      const hasMessage = history.some((h) => h.created_at >= weekBegin && h.created_at < weekEnd);
      if (hasMessage) {
        streak++;
        weekStart = weekBegin;
      } else {
        break;
      }
    }
  }

  // Last contacted
  const lastContacted = history.length > 0 ? timeAgo(history[0].created_at) : 'Never';

  // Category breakdown from draft metadata or simple keyword matching
  const categoryBreakdown: Record<string, number> = {};
  for (const h of history) {
    // Use the message content to guess category if not tagged
    const msg = (h.message || '').toLowerCase();
    let cat = 'general';
    if (msg.includes('good morning') || msg.includes('rise and shine')) cat = 'good-morning';
    else if (msg.includes('checking in') || msg.includes('how are you') || msg.includes('how\'s everything')) cat = 'check-in';
    else if (msg.includes('love') || msg.includes('thinking about you') || msg.includes('appreciate')) cat = 'love-note';
    else if (msg.includes('remind') || msg.includes('don\'t forget')) cat = 'reminder';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  }

  // Weekly activity (last 8 weeks)
  const weeklyActivity: number[] = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = now - (w + 1) * 7 * 86400;
    const weekEnd = now - w * 7 * 86400;
    const count = history.filter((h) => h.created_at >= weekStart && h.created_at < weekEnd).length;
    weeklyActivity.push(count);
  }

  // Score calculation (0-100)
  // Consistency: streak matters (max 30 pts)
  const consistencyScore = Math.min(streak * 5, 30);
  // Effort: messages per week (max 30 pts)
  const effortScore = Math.min(messagesPerWeek * 6, 30);
  // Variety: number of unique categories used (max 20 pts)
  const varietyScore = Math.min(Object.keys(categoryBreakdown).length * 5, 20);
  // Recency: how recently they sent (max 20 pts)
  const recencyDays = history.length > 0 ? (now - history[0].created_at) / 86400 : 999;
  const recencyScore = recencyDays < 1 ? 20 : recencyDays < 3 ? 15 : recencyDays < 7 ? 10 : recencyDays < 14 ? 5 : 0;

  const score = Math.round(consistencyScore + effortScore + varietyScore + recencyScore);

  return { totalSent, messagesPerWeek, streak, lastContacted, categoryBreakdown, weeklyActivity, score };
}

const CATEGORY_COLORS: Record<string, string> = {
  'good-morning': '#D4A03D',
  'check-in': '#5BA899',
  'love-note': '#C07088',
  'reminder': '#8B6FCC',
  'general': '#5B6DEA',
};

const CATEGORY_LABELS: Record<string, string> = {
  'good-morning': 'Good Morning',
  'check-in': 'Check-in',
  'love-note': 'Love Note',
  'reminder': 'Reminder',
  'general': 'General',
};

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : score >= 25 ? '#E0A030' : 'var(--red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fontSize="24" fontWeight="800" fill="var(--text)">
          {score}
        </text>
        <text x="50" y="62" textAnchor="middle" fontSize="10" fill="var(--text-3)">
          / 100
        </text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginTop: 4 }}>
        {score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Needs Work' : 'Needs Attention'}
      </div>
    </div>
  );
}

function BarChart({ data, maxVal }: { data: number[]; maxVal: number }) {
  const labels = ['8w', '7w', '6w', '5w', '4w', '3w', '2w', '1w'];
  const safeMax = maxVal || 1;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, padding: '0 4px',
    }}>
      {data.map((val, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%', borderRadius: 4,
            height: Math.max(4, (val / safeMax) * 60),
            background: val > 0 ? 'var(--accent)' : 'var(--surface-3)',
            opacity: val > 0 ? 0.8 : 0.4,
            transition: 'height 0.4s ease',
          }} />
          <span style={{ fontSize: 9, color: 'var(--text-3)' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics({ contact }: { contact: Contact }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('clawtner_token');
    fetch(`/api/history/${contact.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        const history: HistoryEntry[] = data.history || [];
        setAnalytics(computeAnalytics(history));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [contact.id]);

  if (loading) {
    return (
      <div style={{ padding: '20px 0' }}>
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" style={{ marginTop: 8 }} />
      </div>
    );
  }

  if (!analytics) {
    return <div className="empty-mini">Could not load analytics</div>;
  }

  const catEntries = Object.entries(analytics.categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const maxCatVal = catEntries.length > 0 ? catEntries[0][1] : 1;
  const maxWeekly = Math.max(...analytics.weeklyActivity, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
      {/* Score + Stats row */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px',
      }}>
        <ScoreRing score={analytics.score} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{analytics.totalSent}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Total Sent</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{analytics.messagesPerWeek}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Per Week</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{analytics.streak}w</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Streak</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{analytics.lastContacted}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Last Contact</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '14px 16px',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.5px', color: 'var(--text-3)', marginBottom: 12,
        }}>
          Weekly Activity
        </div>
        <BarChart data={analytics.weeklyActivity} maxVal={maxWeekly} />
      </div>

      {/* Category Breakdown */}
      {catEntries.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '14px 16px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.5px', color: 'var(--text-3)', marginBottom: 12,
          }}>
            Category Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {catEntries.map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 80, fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
                  {CATEGORY_LABELS[cat] || cat}
                </div>
                <div style={{ flex: 1, height: 16, background: 'var(--surface-2)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 8,
                    width: `${(count / maxCatVal) * 100}%`,
                    background: CATEGORY_COLORS[cat] || 'var(--accent)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ width: 28, fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textAlign: 'right' }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score breakdown */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '14px 16px',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.5px', color: 'var(--text-3)', marginBottom: 10,
        }}>
          Score Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Consistency', max: 30, val: Math.min(analytics.streak * 5, 30), color: 'var(--green)' },
            { label: 'Effort', max: 30, val: Math.min(analytics.messagesPerWeek * 6, 30), color: 'var(--accent)' },
            { label: 'Variety', max: 20, val: Math.min(Object.keys(analytics.categoryBreakdown).length * 5, 20), color: 'var(--purple)' },
            { label: 'Recency', max: 20, val: (() => {
              if (analytics.totalSent === 0) return 0;
              const msg = analytics.lastContacted;
              if (msg.includes('just now') || msg.includes('m ago') || msg.includes('h ago')) return 20;
              if (msg.includes('1d') || msg.includes('2d')) return 15;
              if (msg.includes('d ago')) return 10;
              return 5;
            })(), color: 'var(--amber)' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 80, fontSize: 12, color: 'var(--text-2)' }}>{item.label}</div>
              <div style={{ flex: 1, height: 8, background: 'var(--surface-2)', borderRadius: 4 }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${(item.val / item.max) * 100}%`,
                  background: item.color,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ width: 36, fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>
                {Math.round(item.val)}/{item.max}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
