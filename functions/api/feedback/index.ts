import { Env, generateId, sanitize, truncate } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const contactId = url.searchParams.get('contact_id');
    let query = 'SELECT * FROM feedback WHERE 1=1';
    const params: any[] = [];
    if (contactId) { query += ' AND contact_id = ?'; params.push(contactId); }
    query += ' ORDER BY created_at DESC LIMIT 100';
    const result = await context.env.CLAWTNER_DB.prepare(query).bind(...params).all();
    return Response.json({ feedback: result.results });
  } catch {
    return Response.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<{
      draft_id?: string;
      contact_id: string;
      reaction: string;
      response_time?: number;
      original_message?: string;
      edited_message?: string;
      notes?: string;
    }>().catch(() => null);

    if (!body?.contact_id || !body?.reaction) {
      return Response.json({ error: 'contact_id and reaction required' }, { status: 400 });
    }

    const id = generateId();
    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO feedback (id, draft_id, contact_id, reaction, response_time, original_message, edited_message, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.draft_id || null,
      sanitize(body.contact_id),
      truncate(sanitize(body.reaction), 50),
      body.response_time || null,
      body.original_message ? truncate(sanitize(body.original_message), 1000) : null,
      body.edited_message ? truncate(sanitize(body.edited_message), 1000) : null,
      body.notes ? truncate(sanitize(body.notes), 500) : null,
    ).run();

    return Response.json({ id }, { status: 201 });
  } catch {
    return Response.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
};
