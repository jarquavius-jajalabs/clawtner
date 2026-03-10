import { Env } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;
  const contact = await context.env.CLAWTNER_DB.prepare(
    'SELECT * FROM contacts WHERE id = ?'
  ).bind(id).first();
  if (!contact) return Response.json({ error: 'Not found' }, { status: 404 });

  const stats = await context.env.CLAWTNER_DB.prepare(
    'SELECT COUNT(*) as total_sent FROM history WHERE contact_id = ?'
  ).bind(id).first<{ total_sent: number }>();

  return Response.json({ ...contact, total_sent: stats?.total_sent || 0 });
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;
  const body = await context.request.json<Record<string, any>>();

  const allowed = [
    'name', 'phone', 'email', 'channel', 'relationship', 'tone',
    'preferences', 'special_dates', 'address_line1', 'address_line2',
    'city', 'state', 'zip', 'country', 'gift_preferences',
    'love_language', 'love_language_secondary', 'convo_mode', 'convo_mode_escalation',
  ];

  const updates: string[] = [];
  const params: any[] = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      const val = typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key];
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
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;
  await context.env.CLAWTNER_DB.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();
  return Response.json({ ok: true });
};
