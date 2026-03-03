import { Env, generateId } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const result = await context.env.CLAWTNER_DB.prepare(
    'SELECT * FROM channels ORDER BY created_at DESC'
  ).all();
  return Response.json({ channels: result.results });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{
    name: string;
    type?: string;
    url: string;
    method?: string;
    headers?: any;
    contact_ids?: string[];
  }>();

  if (!body?.name || !body?.url) {
    return Response.json({ error: 'name and url required' }, { status: 400 });
  }

  const id = generateId();
  await context.env.CLAWTNER_DB.prepare(
    `INSERT INTO channels (id, name, type, url, method, headers, contact_ids)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.name,
    body.type || 'webhook',
    body.url,
    body.method || 'POST',
    body.headers ? JSON.stringify(body.headers) : null,
    body.contact_ids ? JSON.stringify(body.contact_ids) : null,
  ).run();

  return Response.json({ id }, { status: 201 });
};
