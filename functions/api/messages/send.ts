import { Env, generateId, sanitize, truncate } from '../../lib/db';
import { sendSMS } from '../../lib/twilio';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<{ draft_id?: string; contact_id?: string; message?: string }>().catch(() => null);
    if (!body) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let contactId = body.contact_id;
    let message = body.message ? truncate(sanitize(body.message), 1000) : undefined;
    let draftId = body.draft_id;

    // If draft_id provided, get the draft and contact
    if (draftId) {
      const draft = await context.env.CLAWTNER_DB.prepare(
        'SELECT * FROM drafts WHERE id = ?'
      ).bind(draftId).first<any>();

      if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
      contactId = draft.contact_id;
      message = draft.edited_message || draft.message;
    }

    if (!contactId || !message) {
      return Response.json({ error: 'contact_id and message required' }, { status: 400 });
    }

    // Get contact phone
    const contact = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM contacts WHERE id = ?'
    ).bind(contactId).first<any>();

    if (!contact?.phone) {
      return Response.json({ error: 'Contact has no phone number' }, { status: 400 });
    }

    // Send via Twilio
    const result = await sendSMS(context.env, contact.phone, message);

    // Log to history
    const historyId = generateId();
    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO history (id, draft_id, contact_id, message, status)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(historyId, draftId || null, contactId, message, result.success ? 'sent' : 'failed').run();

    // Log to message_log
    const logId = generateId();
    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO message_log (id, history_id, twilio_sid, from_number, to_number, channel, status, error_message)
       VALUES (?, ?, ?, ?, ?, 'sms', ?, ?)`
    ).bind(
      logId, historyId, result.sid || null,
      context.env.TWILIO_FROM_NUMBER || null, contact.phone,
      result.success ? 'sent' : 'failed',
      result.error || null
    ).run();

    // Update draft status if applicable
    if (draftId) {
      await context.env.CLAWTNER_DB.prepare(
        `UPDATE drafts SET status = ?, sent_at = unixepoch(), updated_at = unixepoch() WHERE id = ?`
      ).bind(result.success ? 'sent' : 'failed', draftId).run();
    }

    if (result.success) {
      return Response.json({ ok: true, sid: result.sid, history_id: historyId });
    } else {
      return Response.json({ error: result.error }, { status: 500 });
    }
  } catch {
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
};
