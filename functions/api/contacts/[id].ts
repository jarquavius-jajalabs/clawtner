import { Env, sanitize, truncate, isValidPhone } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const contact = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM contacts WHERE id = ?'
    ).bind(id).first();
    if (!contact) return Response.json({ error: 'Not found' }, { status: 404 });

    const stats = await context.env.CLAWTNER_DB.prepare(
      'SELECT COUNT(*) as total_sent FROM history WHERE contact_id = ?'
    ).bind(id).first<{ total_sent: number }>();

    return Response.json({ ...contact, total_sent: stats?.total_sent || 0 });
  } catch {
    return Response.json({ error: 'Failed to fetch contact' }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const body = await context.request.json<Record<string, any>>().catch(() => null);
    if (!body) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate phone if provided
    if (body.phone !== undefined && body.phone && !isValidPhone(body.phone)) {
      return Response.json({ error: 'Invalid phone number. Must start with + and have 10+ digits.' }, { status: 400 });
    }

    const allowed = [
      'name', 'phone', 'email', 'channel', 'relationship', 'tone',
      'preferences', 'special_dates', 'address_line1', 'address_line2',
      'city', 'state', 'zip', 'country', 'gift_preferences',
      'love_language', 'love_language_secondary', 'convo_mode', 'convo_mode_escalation',
      'birthday', 'anniversary',
    ];

    // Max lengths per field type
    const maxLens: Record<string, number> = {
      name: 100, phone: 20, email: 100, channel: 50, relationship: 50,
      tone: 100, address_line1: 200, address_line2: 200, city: 100,
      state: 50, zip: 20, country: 10, gift_preferences: 500,
      love_language: 50, love_language_secondary: 50, convo_mode_escalation: 200,
      birthday: 20, anniversary: 20,
    };

    const updates: string[] = [];
    const params: any[] = [];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        let val = typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key];
        if (typeof val === 'string' && key !== 'convo_mode') {
          val = truncate(sanitize(val), maxLens[key] || 500);
        }
        params.push(val);
      }
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = unixepoch()');
    params.push(id);

    await context.env.CLAWTNER_DB.prepare(
      `UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to update contact' }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    await context.env.CLAWTNER_DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
};
