import { Env } from '../../lib/db';
import { placeOrder } from '../../lib/floristone';
import { fireWebhook } from '../../lib/webhooks';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const gift = await context.env.CLAWTNER_DB.prepare('SELECT * FROM gifts WHERE id = ?').bind(id).first();
    if (!gift) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(gift);
  } catch {
    return Response.json({ error: 'Failed to fetch gift' }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const body = await context.request.json<{
      status?: string;
      payment_token?: string;
    }>().catch(() => null);

    if (!body) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const gift = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM gifts WHERE id = ?'
    ).bind(id).first<any>();

    if (!gift) return Response.json({ error: 'Not found' }, { status: 404 });

    if (body.status === 'approved' && body.payment_token) {
      const address = gift.recipient_address ? JSON.parse(gift.recipient_address) : {};
      const result = await placeOrder(context.env.FLORISTONE_API_KEY || '', {
        productId: gift.product_id,
        recipientName: gift.recipient_name,
        recipientAddress: address,
        deliveryDate: gift.delivery_date,
        cardMessage: gift.message_card || '',
        paymentToken: body.payment_token,
        senderName: 'Clawtner User',
        senderEmail: '',
      });

      if (result.success) {
        await context.env.CLAWTNER_DB.prepare(
          `UPDATE gifts SET status = 'ordered', provider_order_id = ?, payment_token = ?, updated_at = unixepoch() WHERE id = ?`
        ).bind(result.orderId || null, body.payment_token, id).run();

        await context.env.CLAWTNER_DB.prepare(
          `INSERT INTO history (id, contact_id, message, status)
           VALUES (?, ?, ?, 'sent')`
        ).bind(
          crypto.randomUUID(),
          gift.contact_id,
          `Sent ${gift.product_name || 'flowers'} (${gift.delivery_date}) — "${gift.message_card || ''}"`,
        ).run();

        const contact = await context.env.CLAWTNER_DB.prepare(
          'SELECT * FROM contacts WHERE id = ?'
        ).bind(gift.contact_id).first();

        await fireWebhook(context.env.CLAWTNER_DB, gift.contact_id, {
          contact,
          message: `Flowers ordered: ${gift.product_name}`,
          gift: { ...gift, status: 'ordered', provider_order_id: result.orderId },
        });

        return Response.json({ ok: true, orderId: result.orderId });
      } else {
        await context.env.CLAWTNER_DB.prepare(
          `UPDATE gifts SET status = 'failed', error = ?, updated_at = unixepoch() WHERE id = ?`
        ).bind(result.error || 'Order failed', id).run();

        return Response.json({ error: result.error }, { status: 500 });
      }
    }

    // Simple status update (reject, etc)
    if (body.status) {
      await context.env.CLAWTNER_DB.prepare(
        'UPDATE gifts SET status = ?, updated_at = unixepoch() WHERE id = ?'
      ).bind(body.status, id).run();
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to update gift' }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    await context.env.CLAWTNER_DB.prepare('DELETE FROM gifts WHERE id = ?').bind(id).run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to delete gift' }, { status: 500 });
  }
};
