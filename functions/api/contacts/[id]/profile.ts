import { Env, generateId, sanitize, truncate } from '../../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const contactId = context.params.id as string;

    const result = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM contact_profile WHERE contact_id = ? ORDER BY category, key'
    ).bind(contactId).all();

    // Group by category
    const grouped: Record<string, Record<string, string>> = {};
    for (const row of (result.results || []) as any[]) {
      if (!grouped[row.category]) grouped[row.category] = {};
      grouped[row.category][row.key] = row.value;
    }

    return Response.json({ profile: grouped, raw: result.results });
  } catch {
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const contactId = context.params.id as string;
    const body = await context.request.json<{ category: string; key: string; value: string }>().catch(() => null);

    if (!body?.category || !body?.key || !body?.value) {
      return Response.json({ error: 'category, key, and value are required' }, { status: 400 });
    }

    const category = truncate(sanitize(body.category), 100);
    const key = truncate(sanitize(body.key), 100);
    const value = truncate(sanitize(body.value), 500);

    if (!category || !key || !value) {
      return Response.json({ error: 'category, key, and value are required' }, { status: 400 });
    }

    const id = generateId();

    // Upsert: delete existing then insert
    await context.env.CLAWTNER_DB.prepare(
      'DELETE FROM contact_profile WHERE contact_id = ? AND category = ? AND key = ?'
    ).bind(contactId, category, key).run();

    await context.env.CLAWTNER_DB.prepare(
      'INSERT INTO contact_profile (id, contact_id, category, key, value) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, contactId, category, key, value).run();

    return Response.json({ id }, { status: 201 });
  } catch {
    return Response.json({ error: 'Failed to save profile field' }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const contactId = context.params.id as string;
    const url = new URL(context.request.url);
    const category = url.searchParams.get('category');
    const key = url.searchParams.get('key');

    if (category && key) {
      await context.env.CLAWTNER_DB.prepare(
        'DELETE FROM contact_profile WHERE contact_id = ? AND category = ? AND key = ?'
      ).bind(contactId, category, key).run();
    } else if (category) {
      await context.env.CLAWTNER_DB.prepare(
        'DELETE FROM contact_profile WHERE contact_id = ? AND category = ?'
      ).bind(contactId, category).run();
    } else {
      return Response.json({ error: 'category is required' }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to delete profile field' }, { status: 500 });
  }
};
