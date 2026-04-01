import { Env } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  // Get all queued iMessage sends with their message text
  const result = await context.env.CLAWTNER_DB.prepare(
    `SELECT ml.id, ml.history_id, ml.to_number, h.message
     FROM message_log ml
     JOIN history h ON h.id = ml.history_id
     WHERE ml.channel = 'imessage' AND ml.status = 'queued'
     ORDER BY ml.created_at ASC
     LIMIT 20`
  ).all();

  return Response.json({ messages: result.results || [] });
};
