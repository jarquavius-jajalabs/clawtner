import { Env } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const contactId = context.params.contact_id as string;
  const result = await context.env.CLAWTNER_DB.prepare(
    'SELECT * FROM history WHERE contact_id = ? ORDER BY created_at DESC LIMIT 100'
  ).bind(contactId).all();
  return Response.json({ history: result.results });
};
