import { Env, generateId, sanitize, truncate } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const contactId = url.searchParams.get('contact_id');

    let query = 'SELECT * FROM cycles WHERE 1=1';
    const params: any[] = [];

    if (contactId) {
      query += ' AND contact_id = ?';
      params.push(contactId);
    }
    query += ' ORDER BY cycle_start DESC LIMIT 20';

    const result = await context.env.CLAWTNER_DB.prepare(query)
      .bind(...params)
      .all();
    return Response.json({ cycles: result.results });
  } catch {
    return Response.json({ error: 'Failed to fetch cycles' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<{
      contact_id: string;
      cycle_start: string;
      cycle_length?: number;
      period_length?: number;
      notes?: string;
    }>().catch(() => null);

    if (!body?.contact_id || !body?.cycle_start) {
      return Response.json({ error: 'contact_id and cycle_start required' }, { status: 400 });
    }

    const id = generateId();
    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO cycles (id, contact_id, cycle_start, cycle_length, period_length, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      sanitize(body.contact_id),
      sanitize(body.cycle_start),
      body.cycle_length || 28,
      body.period_length || 5,
      body.notes ? truncate(sanitize(body.notes), 500) : null,
    ).run();

    return Response.json({ id }, { status: 201 });
  } catch {
    return Response.json({ error: 'Failed to create cycle' }, { status: 500 });
  }
};
