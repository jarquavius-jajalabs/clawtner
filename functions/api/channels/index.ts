import { Env, generateId, sanitize, truncate } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const result = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM channels ORDER BY created_at DESC'
    ).all();
    return Response.json({ channels: result.results });
  } catch {
    return Response.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<{
      name: string;
      type?: string;
      url: string;
      method?: string;
      headers?: any;
      contact_ids?: string[];
    }>().catch(() => null);

    if (!body?.name || !body?.url) {
      return Response.json({ error: 'name and url required' }, { status: 400 });
    }

    const id = generateId();
    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO channels (id, name, type, url, method, headers, contact_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      truncate(sanitize(body.name), 100),
      body.type ? truncate(sanitize(body.type), 50) : 'webhook',
      truncate(sanitize(body.url), 500),
      body.method ? truncate(sanitize(body.method), 10) : 'POST',
      body.headers ? JSON.stringify(body.headers) : null,
      body.contact_ids ? JSON.stringify(body.contact_ids) : null,
    ).run();

    return Response.json({ id }, { status: 201 });
  } catch {
    return Response.json({ error: 'Failed to create channel' }, { status: 500 });
  }
};
