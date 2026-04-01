import { Env, sanitize, truncate } from '../../lib/db';
import { fireWebhook } from '../../lib/webhooks';
import { markForImessageSend } from '../../lib/imessage';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const draft = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM drafts WHERE id = ?'
    )
      .bind(id)
      .first();
    if (!draft) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(draft);
  } catch {
    return Response.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const body = await context.request.json<{
      status?: string;
      edited_message?: string;
    }>().catch(() => null);

    if (!body) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const draft = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM drafts WHERE id = ?'
    )
      .bind(id)
      .first<any>();
    if (!draft) return Response.json({ error: 'Not found' }, { status: 404 });

    const updates: string[] = [];
    const params: any[] = [];

    if (body.status) {
      updates.push('status = ?');
      params.push(body.status);
      if (body.status === 'approved') {
        updates.push('approved_at = unixepoch()');
      }
      if (body.status === 'sent') {
        updates.push('sent_at = unixepoch()');
      }
    }
    if (body.edited_message !== undefined) {
      updates.push('edited_message = ?');
      params.push(truncate(sanitize(body.edited_message), 1000));
    }

    updates.push('updated_at = unixepoch()');
    params.push(id);

    await context.env.CLAWTNER_DB.prepare(
      `UPDATE drafts SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...params)
      .run();

    // On approval, try iMessage first, fall back to webhook
    if (body.status === 'approved') {
      const contact = await context.env.CLAWTNER_DB.prepare(
        'SELECT * FROM contacts WHERE id = ?'
      )
        .bind(draft.contact_id)
        .first<any>();

      const message = body.edited_message
        ? truncate(sanitize(body.edited_message), 1000)
        : (draft.edited_message || draft.message);

      // Log to history as queued (local sender will mark delivered)
      const historyId = crypto.randomUUID();
      await context.env.CLAWTNER_DB.prepare(
        `INSERT INTO history (id, draft_id, contact_id, message, status)
         VALUES (?, ?, ?, ?, 'queued')`
      )
        .bind(historyId, id, draft.contact_id, message)
        .run();

      // Queue for iMessage delivery if contact has phone
      if (contact?.phone) {
        const result = await markForImessageSend(
          context.env.CLAWTNER_DB, historyId, draft.contact_id, contact.phone, message
        );

        if (result.success) {
          await context.env.CLAWTNER_DB.prepare(
            "UPDATE drafts SET status = 'approved', approved_at = unixepoch() WHERE id = ?"
          ).bind(id).run();
        } else {
          await context.env.CLAWTNER_DB.prepare(
            "UPDATE history SET status = 'failed', error = ? WHERE id = ?"
          ).bind(result.error || 'Queue failed', historyId).run();
          await context.env.CLAWTNER_DB.prepare(
            "UPDATE drafts SET status = 'failed', updated_at = unixepoch() WHERE id = ?"
          ).bind(id).run();
        }
      } else {
        // Fallback to webhook
        const result = await fireWebhook(context.env.CLAWTNER_DB, draft.contact_id, {
          contact,
          message,
          draft: { ...draft, status: 'approved' },
        });

        if (result.success) {
          await context.env.CLAWTNER_DB.prepare(
            "UPDATE history SET status = 'delivered', delivered_at = unixepoch() WHERE id = ?"
          ).bind(historyId).run();
          await context.env.CLAWTNER_DB.prepare(
            "UPDATE drafts SET status = 'sent', sent_at = unixepoch() WHERE id = ?"
          ).bind(id).run();
        } else {
          await context.env.CLAWTNER_DB.prepare(
            "UPDATE history SET status = 'failed', error = ? WHERE id = ?"
          ).bind(result.error || 'Unknown error', historyId).run();
          await context.env.CLAWTNER_DB.prepare(
            "UPDATE drafts SET status = 'failed', updated_at = unixepoch() WHERE id = ?"
          ).bind(id).run();
        }
      }
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to update draft' }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    await context.env.CLAWTNER_DB.prepare('DELETE FROM drafts WHERE id = ?')
      .bind(id)
      .run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
};
