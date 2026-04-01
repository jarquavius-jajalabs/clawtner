import { Env, sanitize, truncate } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const ch = await context.env.CLAWTNER_DB.prepare('SELECT * FROM channels WHERE id = ?').bind(id).first();
    if (!ch) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(ch);
  } catch {
    return Response.json({ error: 'Failed to fetch channel' }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const body = await context.request.json<Record<string, any>>().catch(() => null);
    if (!body) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const allowed = ['name', 'type', 'url', 'method', 'headers', 'contact_ids', 'active'];
    const updates: string[] = [];
    const params: any[] = [];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        let val = typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key];
        if (typeof val === 'string') {
          val = truncate(sanitize(val), key === 'url' ? 500 : 100);
        }
        params.push(val);
      }
    }
    if (updates.length === 0) return Response.json({ error: 'Nothing to update' }, { status: 400 });
    params.push(id);
    await context.env.CLAWTNER_DB.prepare(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to update channel' }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    await context.env.CLAWTNER_DB.prepare('DELETE FROM channels WHERE id = ?').bind(id).run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
};
