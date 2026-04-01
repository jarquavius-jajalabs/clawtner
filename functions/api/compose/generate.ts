import { Env, generateId, sanitize } from '../../lib/db';

const TEMPLATES: Record<string, string[]> = {
  'good-morning': [
    'Good morning! Hope you have an amazing day today.',
    'Rise and shine! Thinking of you this morning.',
    'Good morning! Wishing you the best day.',
    'Hey, good morning! Hope today treats you well.',
    'Morning! Sending good vibes your way.',
  ],
  'check-in': [
    'Hey, just checking in. How are you doing?',
    'Hi! Been thinking about you. How\'s everything going?',
    'Just wanted to say hi and see how you\'re doing.',
    'Hey! How are things?',
    'Checking in on you. Hope everything is good!',
  ],
  'love-note': [
    'Just thinking about you and wanted you to know.',
    'Hey, you make my life so much better. Love you.',
    'Random reminder that you\'re amazing.',
    'Can\'t stop thinking about you today.',
    'You make every day worth it.',
  ],
  'reminder': [
    'Quick reminder to check in today.',
    'Don\'t forget about us! Let\'s catch up soon.',
    'Hey, just a gentle nudge.',
  ],
  'custom': [
    'Hey, hope you\'re having a great day!',
  ],
};

function pickTemplate(category: string): string {
  const t = TEMPLATES[category] || TEMPLATES['custom'];
  return t[Math.floor(Math.random() * t.length)];
}

function getCyclePhase(cycleStart: string, cycleLength: number, periodLength: number): string {
  const start = new Date(cycleStart);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const currentDay = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength;

  if (currentDay < periodLength) return 'menstrual';
  if (currentDay < 13) return 'follicular';
  if (currentDay < 17) return 'ovulation';
  return 'luteal';
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<any>().catch(() => null);
    if (!body?.contact_id || !body?.category) {
      return Response.json({ error: 'contact_id and category required' }, { status: 400 });
    }

    const contactId = sanitize(body.contact_id);
    const category = sanitize(body.category);

    // Load contact
    const contact = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM contacts WHERE id = ?'
    ).bind(contactId).first<any>();
    if (!contact) return Response.json({ error: 'Contact not found' }, { status: 404 });

    // Try AI generation if API key exists
    if (context.env.ANTHROPIC_API_KEY) {
      // Load profile
      const profileRes = await context.env.CLAWTNER_DB.prepare(
        'SELECT category, key, value FROM contact_profile WHERE contact_id = ?'
      ).bind(contactId).all<any>();
      const profile: Record<string, Record<string, string>> = {};
      for (const row of profileRes.results || []) {
        if (!profile[row.category]) profile[row.category] = {};
        profile[row.category][row.key] = row.value;
      }

      // Load recent messages
      const historyRes = await context.env.CLAWTNER_DB.prepare(
        'SELECT message FROM history WHERE contact_id = ? ORDER BY created_at DESC LIMIT 5'
      ).bind(contactId).all<any>();
      const recentMessages = (historyRes.results || []).map((r: any) => r.message);

      // Load cycle data
      const cycleRes = await context.env.CLAWTNER_DB.prepare(
        'SELECT * FROM cycles WHERE contact_id = ? ORDER BY cycle_start DESC LIMIT 1'
      ).bind(contactId).first<any>();

      let cyclePhase = '';
      if (cycleRes) {
        cyclePhase = getCyclePhase(cycleRes.cycle_start, cycleRes.cycle_length || 28, cycleRes.period_length || 5);
      }

      const prompt = `You are writing a text message from a person to their ${contact.relationship || 'loved one'}.
Keep it natural, casual, like a real text. Short and sweet. No quotes around the message.
${contact.tone ? `Tone: ${contact.tone}` : ''}
Category: ${category}
Their name: ${contact.name}
${profile.favorites ? `Things they like: ${Object.entries(profile.favorites).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}
${profile.dislikes ? `Things they dislike: ${Object.entries(profile.dislikes).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}
${profile.inside_jokes ? `Inside jokes: ${Object.entries(profile.inside_jokes).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}
${profile.communication ? `Communication style: ${Object.entries(profile.communication).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}
${recentMessages.length > 0 ? `Recent messages sent (don't repeat these): ${recentMessages.join(' | ')}` : ''}
${cyclePhase ? `She's currently in her ${cyclePhase} phase. Adjust tone accordingly.` : ''}

Write ONE text message. Just the message text, nothing else. Keep it under 160 characters unless it needs to be longer.`;

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': context.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 256,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (res.ok) {
          const data = await res.json() as any;
          const aiMessage = data.content?.[0]?.text?.trim();
          if (aiMessage) {
            return Response.json({ message: aiMessage, source: 'ai' });
          }
        }
      } catch {
        // Fall through to template
      }
    }

    // Fallback to template
    return Response.json({ message: pickTemplate(category), source: 'template' });
  } catch {
    return Response.json({ error: 'Failed to generate' }, { status: 500 });
  }
};
