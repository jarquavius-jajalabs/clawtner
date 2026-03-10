import { Env, generateId } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const contactId = url.searchParams.get('contact_id');
  let query = 'SELECT * FROM feedback WHERE 1=1';
  const params: any[] = [];
  if (contactId) { query += ' AND contact_id = ?'; params.push(contactId); }
  query += ' ORDER BY created_at DESC LIMIT 100';
  const result = await context.env.CLAWTNER_DB.prepare(query).bind(...params).all();
  return Response.json({ feedback: result.results });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{
    draft_id?: string;
    contact_id: string;
    reaction: string;
    response_time?: number;
    original_message?: string;
    edited_message?: string;
    notes?: string;
  }>();

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
    body.contact_id,
    body.reaction,
    body.response_time || null,
    body.original_message || null,
    body.edited_message || null,
    body.notes || null,
  ).run();

  return Response.json({ id }, { status: 201 });
};
