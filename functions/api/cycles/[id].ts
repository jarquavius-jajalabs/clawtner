import { Env } from '../../lib/db';

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;
  const body = await context.request.json<Record<string, any>>();
  
  const allowed = ['cycle_start', 'cycle_end', 'cycle_length', 'period_length', 'notes'];
  const updates: string[] = [];
  const params: any[] = [];
  
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(body[key]);
    }
  }
  
  if (updates.length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 });
  }
  
  params.push(id);
  await context.env.CLAWTNER_DB.prepare(
    `UPDATE cycles SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...params).run();
  
  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;
  await context.env.CLAWTNER_DB.prepare('DELETE FROM cycles WHERE id = ?')
    .bind(id).run();
  return Response.json({ ok: true });
};
