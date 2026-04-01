import { useState, useEffect, useCallback } from 'react';
import { Schedule, Contact } from '../lib/types';
import * as api from '../lib/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORIES = [
  { value: 'good-morning', label: 'Good Morning' },
  { value: 'check-in', label: 'Check-in' },
  { value: 'love-note', label: 'Love Note' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'custom', label: 'Custom' },
];

const TYPE_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatNextFire(ts?: number): string {
  if (!ts) return 'Not scheduled';
  const d = new Date(ts * 1000);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return 'Overdue';
  if (diff < 3600000) return `in ${Math.round(diff / 60000)}m`;
  if (diff < 86400000) return `in ${Math.round(diff / 3600000)}h`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function daysOfWeekDisplay(days?: string): string {
  if (!days) return '';
  const nums = days.split(',').map(Number);
  return nums.map((n) => DAYS[n - 1] || '?').join(', ');
}

function monthDayDisplay(md?: string): string {
  if (!md) return '';
  const [m, d] = md.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

interface ScheduleFormData {
  contact_id: string;
  name: string;
  type: string;
  time: string;
  days_of_week: number[];
  day_of_month: number;
  month_day_month: number;
  month_day_day: number;
  category: string;
  prompt_context: string;
}

const emptyForm: ScheduleFormData = {
  contact_id: '',
  name: '',
  type: 'daily',
  time: '09:00',
  days_of_week: [],
  day_of_month: 1,
  month_day_month: 1,
  month_day_day: 1,
  category: 'good-morning',
  prompt_context: '',
};

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState<ScheduleFormData>({ ...emptyForm });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, c] = await Promise.all([api.getSchedules(), api.getContacts()]);
    setSchedules(s.schedules || []);
    setContacts(c.contacts || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const contactMap: Record<string, Contact> = {};
  contacts.forEach((c) => (contactMap[c.id] = c));

  function resetForm() {
    setForm({ ...emptyForm });
    setEditing(null);
    setShowForm(false);
  }

  function openEdit(schedule: Schedule) {
    const dowArr = schedule.days_of_week
      ? schedule.days_of_week.split(',').map(Number)
      : [];
    const [mdMonth, mdDay] = schedule.month_day
      ? schedule.month_day.split('-').map(Number)
      : [1, 1];

    setForm({
      contact_id: schedule.contact_id,
      name: schedule.name || '',
      type: schedule.type,
      time: schedule.time,
      days_of_week: dowArr,
      day_of_month: schedule.day_of_month || 1,
      month_day_month: mdMonth,
      month_day_day: mdDay,
      category: schedule.category,
      prompt_context: schedule.prompt_context || '',
    });
    setEditing(schedule);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact_id || !form.name) return;
    setSubmitting(true);

    const payload: any = {
      contact_id: form.contact_id,
      name: form.name,
      type: form.type,
      time: form.time,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      category: form.category,
      prompt_context: form.prompt_context || undefined,
    };

    if (form.type === 'weekly') {
      payload.days_of_week = form.days_of_week.sort((a, b) => a - b).join(',');
    }
    if (form.type === 'monthly') {
      payload.day_of_month = form.day_of_month;
    }
    if (form.type === 'yearly') {
      payload.month_day = `${form.month_day_month}-${form.month_day_day}`;
    }

    if (editing) {
      await api.updateSchedule(editing.id, payload);
    } else {
      await api.createSchedule(payload);
    }

    setSubmitting(false);
    resetForm();
    load();
  }

  async function handleToggle(schedule: Schedule) {
    await api.updateSchedule(schedule.id, { active: schedule.active ? 0 : 1 });
    load();
  }

  async function handleDelete(id: string) {
    await api.deleteSchedule(id);
    setDeleting(null);
    load();
  }

  function toggleDow(day: number) {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day],
    }));
  }

  if (loading) return (
    <div className="schedules">
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  );

  // Group schedules by contact
  const grouped: Record<string, Schedule[]> = {};
  schedules.forEach((s) => {
    const name = contactMap[s.contact_id]?.name || s.contact_id;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(s);
  });
  const groupNames = Object.keys(grouped).sort();

  return (
    <div className="schedules">
      <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
        + New Schedule
      </button>

      {showForm && (
        <form className="contact-form schedule-form" onSubmit={handleSubmit}>
          <select
            value={form.contact_id}
            onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
            required
          >
            <option value="">Pick a contact...</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            placeholder="Schedule name (e.g. Good morning text)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="form-section">
            <label>Type</label>
            <div className="schedule-type-picker">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`schedule-type-btn ${form.type === t ? 'active' : ''} type-${t}`}
                  onClick={() => setForm({ ...form, type: t })}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label>Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
            />
          </div>

          {form.type === 'weekly' && (
            <div className="form-section">
              <label>Days of week</label>
              <div className="dow-picker">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    className={`dow-chip ${form.days_of_week.includes(i + 1) ? 'active' : ''}`}
                    onClick={() => toggleDow(i + 1)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.type === 'monthly' && (
            <div className="form-section">
              <label>Day of month</label>
              <select
                value={form.day_of_month}
                onChange={(e) => setForm({ ...form, day_of_month: Number(e.target.value) })}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {form.type === 'yearly' && (
            <div className="form-section">
              <label>Month & Day</label>
              <div className="form-row">
                <select
                  value={form.month_day_month}
                  onChange={(e) => setForm({ ...form, month_day_month: Number(e.target.value) })}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={form.month_day_day}
                  onChange={(e) => setForm({ ...form, month_day_day: Number(e.target.value) })}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-section">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label>Prompt context (optional)</label>
            <textarea
              placeholder="Extra context for AI draft generation..."
              value={form.prompt_context}
              onChange={(e) => setForm({ ...form, prompt_context: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {schedules.length === 0 && !showForm && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="var(--border)" strokeWidth="2"/>
              <path d="M24 14v12l8 4" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p>No schedules yet</p>
          <span className="empty-sub">Set up your first one.</span>
        </div>
      )}

      {groupNames.map((name) => (
        <div key={name} className="schedule-group">
          <div className="section-label">{name}</div>
          {grouped[name].map((s) => (
            <div className="schedule-card" key={s.id}>
              <div className="schedule-card-top">
                <div className="schedule-card-left">
                  <div className="schedule-card-name">{s.name || s.category}</div>
                  <div className="schedule-card-meta">
                    <span className={`schedule-type-badge type-${s.type}`}>{TYPE_LABELS[s.type] || s.type}</span>
                    <span className="schedule-time">{formatTime(s.time)}</span>
                    {s.type === 'weekly' && s.days_of_week && (
                      <span className="schedule-days">{daysOfWeekDisplay(s.days_of_week)}</span>
                    )}
                    {s.type === 'monthly' && s.day_of_month && (
                      <span className="schedule-days">Day {s.day_of_month}</span>
                    )}
                    {s.type === 'yearly' && s.month_day && (
                      <span className="schedule-days">{monthDayDisplay(s.month_day)}</span>
                    )}
                  </div>
                </div>
                <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={!!s.active}
                    onChange={() => handleToggle(s)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="schedule-card-bottom">
                <div className="schedule-card-info">
                  <span className="card-category">{s.category}</span>
                  <span className="schedule-next">Next: {formatNextFire(s.next_fire)}</span>
                </div>
                <div className="schedule-card-actions">
                  <button className="btn-edit-small" onClick={() => openEdit(s)}>Edit</button>
                  {deleting === s.id ? (
                    <div className="delete-confirm">
                      <button className="btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                      <button className="btn-edit-small" onClick={() => setDeleting(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn-edit-small btn-delete-small" onClick={() => setDeleting(s.id)}>×</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
