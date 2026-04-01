import { Env } from '../../lib/db';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{
    log_id: string;
    history_id: string;
    status: string;
    error?: string;
  }>();

  if (!body.log_id || !body.status) {
    return Response.json({ error: 'log_id and status required' }, { status: 400 });
  }

  // Update message_log
  await context.env.CLAWTNER_DB.prepare(
    `UPDATE message_log SET status = ?, error_message = ?, updated_at = unixepoch()
     WHERE id = ?`
  ).bind(body.status, body.error || null, body.log_id).run();

  // Update history
  if (body.history_id) {
    if (body.status === 'delivered' || body.status === 'sent') {
      await context.env.CLAWTNER_DB.prepare(
        "UPDATE history SET status = 'delivered', delivered_at = unixepoch() WHERE id = ?"
      ).bind(body.history_id).run();

      // Also update the draft to 'sent'
      await context.env.CLAWTNER_DB.prepare(
        "UPDATE drafts SET status = 'sent', sent_at = unixepoch() WHERE id = (SELECT draft_id FROM history WHERE id = ?)"
      ).bind(body.history_id).run();

      // Update last_contacted on the contact
      await context.env.CLAWTNER_DB.prepare(
        "UPDATE contacts SET last_contacted = unixepoch() WHERE id = (SELECT contact_id FROM history WHERE id = ?)"
      ).bind(body.history_id).run();
    } else if (body.status === 'failed') {
      await context.env.CLAWTNER_DB.prepare(
        "UPDATE history SET status = 'failed', error = ? WHERE id = ?"
      ).bind(body.error || 'Send failed', body.history_id).run();

      await context.env.CLAWTNER_DB.prepare(
        "UPDATE drafts SET status = 'failed', updated_at = unixepoch() WHERE id = (SELECT draft_id FROM history WHERE id = ?)"
      ).bind(body.history_id).run();
    }
  }

  return Response.json({ ok: true });
};
