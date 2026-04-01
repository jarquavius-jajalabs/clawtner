import { Env } from '../../lib/db';

// Twilio status callback webhook
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData();
    const sid = formData.get('MessageSid') as string;
    const status = formData.get('MessageStatus') as string;
    const errorCode = formData.get('ErrorCode') as string | null;
    const errorMessage = formData.get('ErrorMessage') as string | null;

    if (!sid) {
      return new Response('Missing MessageSid', { status: 400 });
    }

    // Update message_log
    await context.env.CLAWTNER_DB.prepare(
      `UPDATE message_log SET status = ?, error_code = ?, error_message = ?, updated_at = unixepoch()
       WHERE twilio_sid = ?`
    ).bind(status, errorCode, errorMessage, sid).run();

    // If delivered, update history
    if (status === 'delivered') {
      const log = await context.env.CLAWTNER_DB.prepare(
        'SELECT history_id FROM message_log WHERE twilio_sid = ?'
      ).bind(sid).first<{ history_id: string }>();

      if (log?.history_id) {
        await context.env.CLAWTNER_DB.prepare(
          "UPDATE history SET status = 'delivered', delivered_at = unixepoch() WHERE id = ?"
        ).bind(log.history_id).run();
      }
    }

    // If failed/undelivered, update history
    if (status === 'failed' || status === 'undelivered') {
      const log = await context.env.CLAWTNER_DB.prepare(
        'SELECT history_id FROM message_log WHERE twilio_sid = ?'
      ).bind(sid).first<{ history_id: string }>();

      if (log?.history_id) {
        await context.env.CLAWTNER_DB.prepare(
          `UPDATE history SET status = 'failed', error = ? WHERE id = ?`
        ).bind(errorMessage || `${status}: ${errorCode}`, log.history_id).run();
      }
    }

    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch {
    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
};
