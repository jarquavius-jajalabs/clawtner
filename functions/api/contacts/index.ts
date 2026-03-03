import { Env, generateId } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const result = await context.env.CLAWTNER_DB.prepare(
    'SELECT * FROM contacts ORDER BY name'
  ).all();
  return Response.json({ contacts: result.results });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    channel?: string;
    relationship?: string;
    tone?: string;
    preferences?: any;
    special_dates?: any;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    gift_preferences?: any;
  }>();

  if (!body?.name) {
    return Response.json({ error: 'Name required' }, { status: 400 });
  }

  const id = body.id || generateId();
  await context.env.CLAWTNER_DB.prepare(
    `INSERT INTO contacts (id, name, phone, email, channel, relationship, tone, preferences, special_dates, address_line1, address_line2, city, state, zip, country, gift_preferences)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.name,
      body.phone || null,
      body.email || null,
      body.channel || 'webhook',
      body.relationship || null,
      body.tone || null,
      body.preferences ? JSON.stringify(body.preferences) : null,
      body.special_dates ? JSON.stringify(body.special_dates) : null,
      body.address_line1 || null,
      body.address_line2 || null,
      body.city || null,
      body.state || null,
      body.zip || null,
      body.country || 'US',
      body.gift_preferences ? JSON.stringify(body.gift_preferences) : null
    )
    .run();

  return Response.json({ id, name: body.name }, { status: 201 });
};
