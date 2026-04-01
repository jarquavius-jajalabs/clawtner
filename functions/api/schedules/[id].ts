import { Env, sanitize, truncate } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const schedule = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM schedules WHERE id = ?'
    ).bind(id).first();

    if (!schedule) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(schedule);
  } catch {
    return Response.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const body = await context.request.json<Record<string, any>>().catch(() => null);
    if (!body) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // auto_approve deliberately excluded - ALWAYS 0, never changeable.
    const allowed = [
      'name', 'type', 'time', 'timezone', 'days_of_week', 'day_of_month',
      'month_day', 'category', 'prompt_context', 'active'
    ];

    const updates: string[] = [];
    const params: any[] = [];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        let val = Array.isArray(body[key]) ? JSON.stringify(body[key]) : body[key];
        if (typeof val === 'string') {
          val = truncate(sanitize(val), key === 'prompt_context' ? 500 : 100);
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
      `UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    await context.env.CLAWTNER_DB.prepare(
      'DELETE FROM schedules WHERE id = ?'
    ).bind(id).run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
};
