import { useState, useEffect } from 'react';
import { Contact } from '../lib/types';

interface CycleData {
  cycleStart: string;
  cycleLength: number;
  periodLength: number;
}

interface DayInfo {
  date: string;
  dayNum: number;
  phase: 'period' | 'follicular' | 'ovulation' | 'luteal';
  phaseLabel: string;
  mood: string;
  energy: string;
  tip: string;
}

function getCycleDay(cycleStart: string, cycleLength: number): number {
  if (!cycleStart) return 1;
  const start = new Date(cycleStart + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  if (diff < 0) return 1;
  return ((diff % cycleLength) + cycleLength) % cycleLength + 1;
}

function getPhaseInfo(day: number, periodLength: number, cycleLength: number): DayInfo {
  const today = new Date().toISOString().split('T')[0];

  if (day <= periodLength) {
    return {
      date: today, dayNum: day, phase: 'period',
      phaseLabel: 'Menstrual',
      mood: 'May feel tired or emotional',
      energy: 'Low — rest is important',
      tip: 'Be extra gentle and thoughtful. Comfort food, cozy vibes.',
    };
  }
  if (day <= cycleLength * 0.38) {
    return {
      date: today, dayNum: day, phase: 'follicular',
      phaseLabel: 'Follicular',
      mood: 'Energy rising, feeling optimistic',
      energy: 'Building — great for new plans',
      tip: 'She\'s feeling social and creative. Plan a date or adventure.',
    };
  }
  if (day <= cycleLength * 0.5) {
    return {
      date: today, dayNum: day, phase: 'ovulation',
      phaseLabel: 'Ovulation',
      mood: 'Confident, social, high energy',
      energy: 'Peak energy',
      tip: 'Best time for date nights, compliments land extra well.',
    };
  }
  return {
    date: today, dayNum: day, phase: 'luteal',
    phaseLabel: 'Luteal',
    mood: 'Winding down, may feel sensitive',
    energy: 'Declining — cravings may kick in',
    tip: 'Extra patience. Surprise her with her favorite snack or flowers.',
  };
}

const PHASE_COLORS = {
  period: '#ff6b6b',
  follicular: '#48c78e',
  ovulation: '#e8a87c',
  luteal: '#8888cc',
};

const PHASE_ICONS = {
  period: '🌙',
  follicular: '🌱',
  ovulation: '☀️',
  luteal: '🍂',
};

export default function CycleTracker({ contact }: { contact: Contact }) {
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ cycleStart: '', cycleLength: '28', periodLength: '5' });

  useEffect(() => {
    const saved = localStorage.getItem(`cycle_${contact.id}`);
    if (saved) setCycle(JSON.parse(saved));
  }, [contact.id]);

  function saveCycle() {
    const data: CycleData = {
      cycleStart: form.cycleStart,
      cycleLength: parseInt(form.cycleLength),
      periodLength: parseInt(form.periodLength),
    };
    localStorage.setItem(`cycle_${contact.id}`, JSON.stringify(data));
    setCycle(data);
    setEditing(false);
  }

  if (!cycle && !editing) {
    return (
      <div className="cycle-empty">
        <p>No cycle data tracked yet</p>
        <button className="btn-small" onClick={() => setEditing(true)}>Set Up Tracker</button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="cycle-form">
        <label>Last period start date</label>
        <input type="date" value={form.cycleStart} onChange={(e) => setForm({ ...form, cycleStart: e.target.value })} />
        <label>Average cycle length (days)</label>
        <input type="number" value={form.cycleLength} onChange={(e) => setForm({ ...form, cycleLength: e.target.value })} />
        <label>Average period length (days)</label>
        <input type="number" value={form.periodLength} onChange={(e) => setForm({ ...form, periodLength: e.target.value })} />
        <div className="form-actions">
          <button className="btn-primary" onClick={saveCycle}>Save</button>
          <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  const day = getCycleDay(cycle!.cycleStart, cycle!.cycleLength);
  const info = getPhaseInfo(day, cycle!.periodLength, cycle!.cycleLength);
  const progress = (day / cycle!.cycleLength) * 100;
  const nextPeriod = cycle!.cycleLength - day;

  // Build visual cycle ring days
  const days = [];
  for (let i = 1; i <= cycle!.cycleLength; i++) {
    const p = getPhaseInfo(i, cycle!.periodLength, cycle!.cycleLength);
    days.push({ day: i, phase: p.phase, isCurrent: i === day });
  }

  return (
    <div className="cycle-tracker">
      <div className="cycle-header">
        <div className="cycle-phase-badge" style={{ background: PHASE_COLORS[info.phase] + '22', color: PHASE_COLORS[info.phase], borderColor: PHASE_COLORS[info.phase] }}>
          <span className="phase-icon">{PHASE_ICONS[info.phase]}</span>
          <span>{info.phaseLabel} Phase</span>
        </div>
        <button className="btn-edit-small" onClick={() => { setForm({ cycleStart: cycle!.cycleStart, cycleLength: String(cycle!.cycleLength), periodLength: String(cycle!.periodLength) }); setEditing(true); }}>Edit</button>
      </div>

      <div className="cycle-day-display">
        <div className="cycle-day-number">Day {day}</div>
        <div className="cycle-day-of">of {cycle!.cycleLength}</div>
      </div>

      <div className="cycle-progress-bar">
        <div className="cycle-progress-fill" style={{ width: `${progress}%`, background: PHASE_COLORS[info.phase] }} />
        <div className="cycle-progress-marker" style={{ left: `${progress}%` }} />
      </div>

      <div className="cycle-dots">
        {days.map((d) => (
          <div
            key={d.day}
            className={`cycle-dot ${d.isCurrent ? 'current' : ''}`}
            style={{ background: d.isCurrent ? PHASE_COLORS[d.phase] : PHASE_COLORS[d.phase] + '44' }}
            title={`Day ${d.day}`}
          />
        ))}
      </div>

      <div className="cycle-info-grid">
        <div className="cycle-info-card">
          <div className="info-label">Mood</div>
          <div className="info-value">{info.mood}</div>
        </div>
        <div className="cycle-info-card">
          <div className="info-label">Energy</div>
          <div className="info-value">{info.energy}</div>
        </div>
        <div className="cycle-info-card tip">
          <div className="info-label">💡 Tip for you</div>
          <div className="info-value">{info.tip}</div>
        </div>
      </div>

      {nextPeriod <= 5 && (
        <div className="cycle-alert">
          Next period in ~{nextPeriod} day{nextPeriod !== 1 ? 's' : ''}. Stock up on comfort items.
        </div>
      )}
    </div>
  );
}
