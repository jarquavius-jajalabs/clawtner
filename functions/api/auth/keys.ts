import { Env, generateId, sanitize, truncate } from '../../lib/db';
import { hashKey } from '../../lib/auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<{ name: string }>().catch(() => null);
    if (!body?.name) {
      return Response.json({ error: 'Name required' }, { status: 400 });
    }

    const name = truncate(sanitize(body.name), 100);
    if (!name) {
      return Response.json({ error: 'Name required' }, { status: 400 });
    }

    const rawKey = `clw_${crypto.randomUUID().replace(/-/g, '')}`;
    const keyHash = await hashKey(rawKey);
    const id = generateId();

    await context.env.CLAWTNER_DB.prepare(
      'INSERT INTO api_keys (id, name, key_hash) VALUES (?, ?, ?)'
    )
      .bind(id, name, keyHash)
      .run();

    // Return the raw key ONCE — it can never be retrieved again
    return Response.json({ id, name, key: rawKey });
  } catch {
    return Response.json({ error: 'Failed to create API key' }, { status: 500 });
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const keys = await context.env.CLAWTNER_DB.prepare(
      'SELECT id, name, permissions, active, created_at, last_used FROM api_keys ORDER BY created_at DESC'
    ).all();
    return Response.json({ keys: keys.results });
  } catch {
    return Response.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
};
