import { Env, generateId } from '../../lib/db';

// Fallback templates by category
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

interface ProfileData {
  favorites: Record<string, string>;
  dislikes: Record<string, string>;
  inside_jokes: Record<string, string>;
  communication: Record<string, string>;
  [key: string]: Record<string, string>;
}

function formatProfileSection(data: Record<string, string>): string {
  const entries = Object.entries(data);
  if (entries.length === 0) return 'None recorded';
  return entries.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ');
}

async function generateWithAI(
  env: Env,
  schedule: any,
  contact: any,
  profile: ProfileData,
  recentMessages: string[],
  cycleData: any | null,
): Promise<string | null> {
  if (!env.ANTHROPIC_API_KEY) return null;

  let prompt = `You are writing a text message from a person to their ${contact.relationship || 'loved one'}.\nKeep it natural, casual, like a real text. No emojis unless the communication style says otherwise.\n\nCategory: ${schedule.category || 'general'}\nTone: ${contact.tone || 'warm and casual'}\nTheir name: ${contact.name}`;

  prompt += `\nThings they like: ${formatProfileSection(profile.favorites || {})}`;
  prompt += `\nThings they dislike: ${formatProfileSection(profile.dislikes || {})}`;
  prompt += `\nInside jokes: ${formatProfileSection(profile.inside_jokes || {})}`;
  prompt += `\nCommunication style: ${formatProfileSection(profile.communication || {})}`;

  if (recentMessages.length > 0) {
    prompt += `\n\nRecent messages sent (don't repeat these):\n${recentMessages.map((m) => `- ${m}`).join('\n')}`;
  }

  if (cycleData) {
    const phase = getCyclePhase(cycleData);
    if (phase) {
      prompt += `\n\nShe's currently in her ${phase} phase. Adjust tone accordingly.`;
    }
  }

  if (schedule.prompt_context) {
    prompt += `\n\nAdditional context: ${schedule.prompt_context}`;
  }

  prompt += `\n\nWrite ONE text message. Just the message, nothing else. Keep it under 160 characters unless it needs to be longer.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json() as { content?: { type: string; text: string }[] };
    const text = data.content?.[0]?.text?.trim();
    return text || null;
  } catch {
    return null;
  }
}

function getCyclePhase(cycle: any): string | null {
  if (!cycle?.cycle_start) return null;
  const start = new Date(cycle.cycle_start + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  if (diff < 0) return null;
  const cycleLength = cycle.cycle_length || 28;
  const periodLength = cycle.period_length || 5;
  const day = ((diff % cycleLength) + cycleLength) % cycleLength + 1;

  if (day <= periodLength) return 'menstrual';
  if (day <= Math.round(cycleLength * 0.5)) return 'follicular';
  if (day <= Math.round(cycleLength * 0.6)) return 'ovulation';
  return 'luteal';
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
  try {
  const now = Math.floor(Date.now() / 1000);

  // Rate limit: skip if last run was < 30 seconds ago
  try {
    const lastRun = await context.env.CLAWTNER_DB.prepare(
      "SELECT value FROM kv_store WHERE key = 'last_cron_fire'"
    ).first<{ value: string }>();
    if (lastRun && (now - parseInt(lastRun.value)) < 30) {
      return Response.json({ ok: true, skipped: true, reason: 'Rate limited (< 30s since last run)' });
    }
    // Update last run time (upsert)
    await context.env.CLAWTNER_DB.prepare(
      "INSERT INTO kv_store (key, value) VALUES ('last_cron_fire', ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    ).bind(String(now), String(now)).run();
  } catch {
    // kv_store table might not exist, create it
    try {
      await context.env.CLAWTNER_DB.prepare(
        'CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT)'
      ).run();
      await context.env.CLAWTNER_DB.prepare(
        "INSERT OR REPLACE INTO kv_store (key, value) VALUES ('last_cron_fire', ?)"
      ).bind(String(now)).run();
    } catch {
      // Non-critical, proceed without rate limiting
    }
  }

  // Get all active schedules that are due
  const result = await context.env.CLAWTNER_DB.prepare(
    'SELECT s.*, c.name as contact_name FROM schedules s JOIN contacts c ON c.id = s.contact_id WHERE s.active = 1 AND s.next_fire <= ?'
  ).bind(now).all<any>();

  const schedules = result.results || [];
  const generated: string[] = [];

  for (const schedule of schedules) {
    let message: string;

    // Try AI generation first
    try {
      // Load contact info
      const contactRes = await context.env.CLAWTNER_DB.prepare(
        'SELECT * FROM contacts WHERE id = ?'
      ).bind(schedule.contact_id).first<any>();

      // Load Soul MD profile
      const profileRes = await context.env.CLAWTNER_DB.prepare(
        'SELECT * FROM contact_profile WHERE contact_id = ?'
      ).bind(schedule.contact_id).all<any>();

      const profile: ProfileData = { favorites: {}, dislikes: {}, inside_jokes: {}, communication: {} };
      for (const row of (profileRes.results || [])) {
        if (!profile[row.category]) profile[row.category] = {};
        profile[row.category][row.key] = row.value;
      }

      // Load recent messages
      const historyRes = await context.env.CLAWTNER_DB.prepare(
        'SELECT message FROM history WHERE contact_id = ? ORDER BY created_at DESC LIMIT 5'
      ).bind(schedule.contact_id).all<any>();
      const recentMessages = (historyRes.results || []).map((r: any) => r.message);

      // Load cycle data if exists
      const cycleRes = await context.env.CLAWTNER_DB.prepare(
        'SELECT * FROM cycles WHERE contact_id = ? ORDER BY cycle_start DESC LIMIT 1'
      ).bind(schedule.contact_id).first<any>();

      const aiMessage = await generateWithAI(
        context.env,
        schedule,
        contactRes || { name: schedule.contact_name, relationship: '', tone: '' },
        profile,
        recentMessages,
        cycleRes || null,
      );

      message = aiMessage || pickTemplate(schedule.category || 'general');
    } catch {
      // Fall back to template on any error
      message = pickTemplate(schedule.category || 'general');
    }

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
  } catch {
    return Response.json({ error: 'Cron job failed' }, { status: 500 });
  }
};
