import { Env } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50') || 50, 1), 200);
    const result = await context.env.CLAWTNER_DB.prepare(
      `SELECT h.*, c.name as contact_name
       FROM history h LEFT JOIN contacts c ON h.contact_id = c.id
       ORDER BY h.created_at DESC LIMIT ?`
    ).bind(limit).all();
    return Response.json({ history: result.results });
  } catch {
    return Response.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
};
