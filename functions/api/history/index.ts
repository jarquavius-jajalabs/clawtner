import { Env } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const result = await context.env.CLAWTNER_DB.prepare(
    `SELECT h.*, c.name as contact_name
     FROM history h LEFT JOIN contacts c ON h.contact_id = c.id
     ORDER BY h.created_at DESC LIMIT ?`
  ).bind(limit).all();
  return Response.json({ history: result.results });
};
