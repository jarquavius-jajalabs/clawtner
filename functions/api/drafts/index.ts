import { Env, generateId, sanitize, truncate } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const status = url.searchParams.get('status');
    const contactId = url.searchParams.get('contact_id');

    let query = 'SELECT * FROM drafts WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (contactId) {
      query += ' AND contact_id = ?';
      params.push(contactId);
    }
    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await context.env.CLAWTNER_DB.prepare(query)
      .bind(...params)
      .all();
    return Response.json({ drafts: result.results });
  } catch {
    return Response.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<{
      contact_id: string;
      message: string;
      category?: string;
      suggested_time?: number;
      metadata?: any;
    }>().catch(() => null);

    if (!body?.contact_id || !body?.message) {
      return Response.json(
        { error: 'contact_id and message required' },
        { status: 400 }
      );
    }

    const message = truncate(sanitize(body.message), 1000);
    if (!message) {
      return Response.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const id = generateId();
    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO drafts (id, contact_id, message, category, suggested_time, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        sanitize(body.contact_id),
        message,
        body.category ? truncate(sanitize(body.category), 50) : 'general',
        body.suggested_time || null,
        body.metadata ? JSON.stringify(body.metadata) : null
      )
      .run();

    return Response.json({ id, status: 'pending' }, { status: 201 });
  } catch {
    return Response.json({ error: 'Failed to create draft' }, { status: 500 });
  }
};
