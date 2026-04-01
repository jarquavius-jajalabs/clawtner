import { Env, generateId } from '../../lib/db';

// Message templates by category
const TEMPLATES: Record<string, string[]> = {
  'good-morning': [
    'Good morning! Hope you have an amazing day today.',
    'Rise and shine! Thinking of you this morning.',
    'Good morning! Just wanted to start your day with a smile.',
    'Hey, good morning! Hope today treats you well.',
    'Morning! Sending you good vibes for the day ahead.',
  ],
  'check-in': [
    'Hey, just checking in. How are you doing?',
    'Hi! Been thinking about you. How\'s everything going?',
    'Just wanted to say hi and see how you\'re doing.',
    'Hey! It\'s been a bit. How are things?',
    'Checking in on you. Hope everything is good!',
  ],
  'love-note': [
    'Just thinking about you and wanted you to know.',
    'Hey, you make my life so much better. Love you.',
    'Random reminder that you\'re amazing and I appreciate you.',
    'Can\'t stop thinking about you today.',
    'You make every day worth it. Just wanted you to know that.',
  ],
  'reminder': [
    'Hey, just a quick reminder to check in today.',
    'Don\'t forget about us! Let\'s catch up soon.',
    'Quick reminder that I\'m here and thinking of you.',
  ],
  'general': [
    'Hey! Hope you\'re having a great day.',
    'Hi there! Just wanted to reach out.',
    'Hey, how\'s your day going?',
  ],
};

function pickTemplate(category: string): string {
  const templates = TEMPLATES[category] || TEMPLATES['general'];
  return templates[Math.floor(Math.random() * templates.length)];
}

function calculateNextFire(schedule: any): number {
  const [hours, minutes] = (schedule.time || '08:00').split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (schedule.type === 'daily') {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (schedule.type === 'weekly' && schedule.days_of_week) {
    const days = JSON.parse(schedule.days_of_week) as number[];
    const today = now.getDay();
    let found = false;
    for (let i = 1; i <= 7; i++) {
      const checkDay = (today + i) % 7;
      if (days.includes(checkDay)) {
        next.setDate(now.getDate() + i);
        next.setHours(hours, minutes, 0, 0);
        found = true;
        break;
      }
    }
    if (!found) next.setDate(next.getDate() + 7);
  } else if (schedule.type === 'monthly') {
    next.setDate(schedule.day_of_month || 1);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else if (schedule.type === 'yearly' && schedule.month_day) {
    const [month, day] = schedule.month_day.split('-').map(Number);
    next.setMonth(month - 1, day);
    if (next <= now) next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setDate(next.getDate() + 1);
  }

  return Math.floor(next.getTime() / 1000);
}

// This endpoint is called by Cloudflare Cron Trigger or manually
// It checks for due schedules and generates drafts
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const now = Math.floor(Date.now() / 1000);

  // Get all active schedules that are due
  const result = await context.env.CLAWTNER_DB.prepare(
    'SELECT s.*, c.name as contact_name FROM schedules s JOIN contacts c ON c.id = s.contact_id WHERE s.active = 1 AND s.next_fire <= ?'
  ).bind(now).all<any>();

  const schedules = result.results || [];
  const generated: string[] = [];

  for (const schedule of schedules) {
    // Generate a draft from template (later: AI generation using contact profile)
    const message = pickTemplate(schedule.category || 'general');
    const draftId = generateId();

    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO drafts (id, contact_id, message, category, status, suggested_time)
       VALUES (?, ?, ?, ?, 'pending', ?)`
    ).bind(draftId, schedule.contact_id, message, schedule.category || 'general', now).run();

    // Update schedule: last_fired and next_fire
    const nextFire = calculateNextFire(schedule);
    await context.env.CLAWTNER_DB.prepare(
      'UPDATE schedules SET last_fired = ?, next_fire = ?, updated_at = unixepoch() WHERE id = ?'
    ).bind(now, nextFire, schedule.id).run();

    generated.push(`${schedule.contact_name}: ${schedule.name || schedule.category}`);
  }

  return Response.json({
    ok: true,
    checked: schedules.length,
    generated: generated.length,
    details: generated,
  });
};
