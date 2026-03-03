import { Env, generateId } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
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
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{
    contact_id: string;
    message: string;
    category?: string;
    suggested_time?: number;
    metadata?: any;
  }>();

  if (!body?.contact_id || !body?.message) {
    return Response.json(
      { error: 'contact_id and message required' },
      { status: 400 }
    );
  }

  const id = generateId();
  await context.env.CLAWTNER_DB.prepare(
    `INSERT INTO drafts (id, contact_id, message, category, suggested_time, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.contact_id,
      body.message,
      body.category || 'general',
      body.suggested_time || null,
      body.metadata ? JSON.stringify(body.metadata) : null
    )
    .run();

  return Response.json({ id, status: 'pending' }, { status: 201 });
};
