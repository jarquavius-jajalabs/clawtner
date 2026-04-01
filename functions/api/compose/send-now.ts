import { Env, generateId, sanitize, truncate } from '../../lib/db';
import { markForImessageSend } from '../../lib/imessage';

// Send a message immediately (bypasses queue, still goes through iMessage pipeline)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<any>().catch(() => null);
    if (!body?.contact_id || !body?.message) {
      return Response.json({ error: 'contact_id and message required' }, { status: 400 });
    }

    const contactId = sanitize(body.contact_id);
    const message = truncate(sanitize(body.message), 1000);
    const category = sanitize(body.category || 'custom');

    // Get contact
    const contact = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM contacts WHERE id = ?'
    ).bind(contactId).first<any>();

    if (!contact?.phone) {
      return Response.json({ error: 'Contact has no phone number' }, { status: 400 });
    }

    // Create draft as already approved
    const draftId = generateId();
    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO drafts (id, contact_id, message, category, status, approved_at)
       VALUES (?, ?, ?, ?, 'approved', unixepoch())`
    ).bind(draftId, contactId, message, category).run();

    // Create history entry
    const historyId = generateId();
    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO history (id, draft_id, contact_id, message, status)
       VALUES (?, ?, ?, ?, 'queued')`
    ).bind(historyId, draftId, contactId, message).run();

    // Queue for iMessage
    const result = await markForImessageSend(
      context.env.CLAWTNER_DB, historyId, contactId, contact.phone, message
    );

    if (result.success) {
      // Update last_contacted
      await context.env.CLAWTNER_DB.prepare(
        'UPDATE contacts SET last_contacted = unixepoch() WHERE id = ?'
      ).bind(contactId).run();

      return Response.json({ ok: true, draft_id: draftId, history_id: historyId });
    } else {
      return Response.json({ error: result.error || 'Failed to queue' }, { status: 500 });
    }
  } catch {
    return Response.json({ error: 'Send failed' }, { status: 500 });
  }
};
