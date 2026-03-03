import { Env, generateId } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const status = url.searchParams.get('status');
  let query = 'SELECT * FROM gifts WHERE 1=1';
  const params: any[] = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY created_at DESC LIMIT 50';
  const result = await context.env.CLAWTNER_DB.prepare(query).bind(...params).all();
  return Response.json({ gifts: result.results });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{
    contact_id: string;
    product_id: string;
    product_name?: string;
    product_image?: string;
    product_price?: number;
    delivery_date: string;
    message_card?: string;
    metadata?: any;
  }>();

  if (!body?.contact_id || !body?.product_id || !body?.delivery_date) {
    return Response.json({ error: 'contact_id, product_id, and delivery_date required' }, { status: 400 });
  }

  // Get contact for recipient info
  const contact = await context.env.CLAWTNER_DB.prepare(
    'SELECT * FROM contacts WHERE id = ?'
  ).bind(body.contact_id).first<any>();

  if (!contact) {
    return Response.json({ error: 'Contact not found' }, { status: 404 });
  }

  const id = generateId();
  await context.env.CLAWTNER_DB.prepare(
    `INSERT INTO gifts (id, contact_id, product_id, product_name, product_image, product_price, delivery_date, message_card, recipient_name, recipient_address, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.contact_id,
    body.product_id,
    body.product_name || null,
    body.product_image || null,
    body.product_price || null,
    body.delivery_date,
    body.message_card || null,
    contact.name,
    JSON.stringify({
      line1: contact.address_line1,
      line2: contact.address_line2,
      city: contact.city,
      state: contact.state,
      zip: contact.zip,
      country: contact.country,
    }),
    body.metadata ? JSON.stringify(body.metadata) : null,
  ).run();

  return Response.json({ id, status: 'pending' }, { status: 201 });
};
