import { Env, sanitize, truncate } from '../../../../lib/db';

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const fieldId = context.params.fieldId as string;
    const body = await context.request.json<{
      category?: string;
      key?: string;
      value?: string;
    }>().catch(() => null);

    if (!body) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (body.category !== undefined) { updates.push('category = ?'); params.push(truncate(sanitize(body.category), 100)); }
    if (body.key !== undefined) { updates.push('key = ?'); params.push(truncate(sanitize(body.key), 100)); }
    if (body.value !== undefined) { updates.push('value = ?'); params.push(truncate(sanitize(body.value), 500)); }

    if (updates.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(fieldId);
    await context.env.CLAWTNER_DB.prepare(
      `UPDATE contact_profile SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to update profile field' }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const fieldId = context.params.fieldId as string;
    await context.env.CLAWTNER_DB.prepare(
      'DELETE FROM contact_profile WHERE id = ?'
    ).bind(fieldId).run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to delete profile field' }, { status: 500 });
  }
};
