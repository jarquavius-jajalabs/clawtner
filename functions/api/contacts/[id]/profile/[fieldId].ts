import { Env } from '../../../../lib/db';

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const fieldId = context.params.fieldId as string;
  const body = await context.request.json<{
    category?: string;
    key?: string;
    value?: string;
  }>();

  const updates: string[] = [];
  const params: any[] = [];

  if (body.category !== undefined) { updates.push('category = ?'); params.push(body.category); }
  if (body.key !== undefined) { updates.push('key = ?'); params.push(body.key); }
  if (body.value !== undefined) { updates.push('value = ?'); params.push(body.value); }

  if (updates.length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 });
  }

  params.push(fieldId);
  await context.env.CLAWTNER_DB.prepare(
    `UPDATE contact_profile SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...params).run();

  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const fieldId = context.params.fieldId as string;
  await context.env.CLAWTNER_DB.prepare(
    'DELETE FROM contact_profile WHERE id = ?'
  ).bind(fieldId).run();
  return Response.json({ ok: true });
};
