import { Env, generateId, sanitize, truncate, isValidPhone } from '../../lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const result = await context.env.CLAWTNER_DB.prepare(
      'SELECT * FROM contacts ORDER BY name'
    ).all();
    return Response.json({ contacts: result.results });
  } catch {
    return Response.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
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
    }>().catch(() => null);

    if (!body?.name) {
      return Response.json({ error: 'Name required' }, { status: 400 });
    }

    const name = truncate(sanitize(body.name), 100);
    if (!name) {
      return Response.json({ error: 'Name required' }, { status: 400 });
    }

    const phone = body.phone ? truncate(sanitize(body.phone), 20) : null;
    if (phone && !isValidPhone(phone)) {
      return Response.json({ error: 'Invalid phone number. Must start with + and have 10+ digits.' }, { status: 400 });
    }

    const id = body.id ? truncate(sanitize(body.id), 100) : generateId();
    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO contacts (id, name, phone, email, channel, relationship, tone, preferences, special_dates, address_line1, address_line2, city, state, zip, country, gift_preferences)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        name,
        phone,
        body.email ? truncate(sanitize(body.email), 100) : null,
        body.channel ? truncate(sanitize(body.channel), 50) : 'webhook',
        body.relationship ? truncate(sanitize(body.relationship), 50) : null,
        body.tone ? truncate(sanitize(body.tone), 100) : null,
        body.preferences ? JSON.stringify(body.preferences) : null,
        body.special_dates ? JSON.stringify(body.special_dates) : null,
        body.address_line1 ? truncate(sanitize(body.address_line1), 200) : null,
        body.address_line2 ? truncate(sanitize(body.address_line2), 200) : null,
        body.city ? truncate(sanitize(body.city), 100) : null,
        body.state ? truncate(sanitize(body.state), 50) : null,
        body.zip ? truncate(sanitize(body.zip), 20) : null,
        body.country ? truncate(sanitize(body.country), 10) : 'US',
        body.gift_preferences ? truncate(sanitize(typeof body.gift_preferences === 'string' ? body.gift_preferences : JSON.stringify(body.gift_preferences)), 500) : null
      )
      .run();

    return Response.json({ id, name }, { status: 201 });
  } catch (e: any) {
    if (e?.message?.includes('UNIQUE constraint')) {
      return Response.json({ error: 'A contact with that ID already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Failed to create contact' }, { status: 500 });
  }
};
