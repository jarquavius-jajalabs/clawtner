import { Env } from '../../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const contactId = context.params.contact_id as string;

    const insights = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM insights WHERE contact_id = ? ORDER BY score DESC'
    ).bind(contactId).all();

    const stats = await context.env.CLAWTNER_DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN reaction = 'thumbs_up' THEN 1 ELSE 0 END) as thumbs_up,
        SUM(CASE WHEN reaction = 'thumbs_down' THEN 1 ELSE 0 END) as thumbs_down,
        SUM(CASE WHEN reaction = 'edited' THEN 1 ELSE 0 END) as edited,
        AVG(response_time) as avg_response_time
      FROM feedback WHERE contact_id = ?
    `).bind(contactId).first<any>();

    return Response.json({
      insights: insights.results,
      stats: {
        total: stats?.total || 0,
        thumbs_up: stats?.thumbs_up || 0,
        thumbs_down: stats?.thumbs_down || 0,
        edited: stats?.edited || 0,
        approval_rate: stats?.total > 0
          ? Math.round(((stats.thumbs_up || 0) / stats.total) * 100)
          : null,
        edit_rate: stats?.total > 0
          ? Math.round(((stats.edited || 0) / stats.total) * 100)
          : null,
        avg_response_time: stats?.avg_response_time ? Math.round(stats.avg_response_time) : null,
      },
    });
  } catch {
    return Response.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
};
