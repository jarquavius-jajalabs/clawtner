import { Env, generateId, now, sanitize, truncate } from '../../lib/db';

// Calculate next fire time from schedule
function calculateNextFire(schedule: any): number {
  const [hours, minutes] = (schedule.time || '08:00').split(':').map(Number);
  const nowMs = Date.now();
  const today = new Date(nowMs);

  today.setHours(hours, minutes, 0, 0);

  if (today.getTime() <= nowMs) {
    if (schedule.type === 'daily') {
      today.setDate(today.getDate() + 1);
    } else if (schedule.type === 'weekly') {
      const days = JSON.parse(schedule.days_of_week || '[1]');
      const currentDay = today.getDay();
      let nextDay = days.find((d: number) => d > currentDay);
      if (!nextDay) nextDay = days[0] + 7;
      today.setDate(today.getDate() + (nextDay - currentDay));
    } else if (schedule.type === 'monthly') {
      today.setMonth(today.getMonth() + 1);
      today.setDate(schedule.day_of_month || 1);
    } else {
      today.setDate(today.getDate() + 1);
    }
  }

  return Math.floor(today.getTime() / 1000);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const contactId = url.searchParams.get('contact_id');

    let query = 'SELECT * FROM schedules';
    const params: any[] = [];

    if (contactId) {
      query += ' WHERE contact_id = ?';
      params.push(contactId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await context.env.CLAWTNER_DB.prepare(query)
      .bind(...params)
      .all();

    return Response.json({ schedules: result.results });
  } catch {
    return Response.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<any>().catch(() => null);

    if (!body?.contact_id || !body?.type || !body?.time) {
      return Response.json(
        { error: 'contact_id, type, and time are required' },
        { status: 400 }
      );
    }

    const id = generateId();
    const schedule = { id, ...body };
    const nextFire = calculateNextFire(schedule);

    await context.env.CLAWTNER_DB.prepare(
      `INSERT INTO schedules (id, contact_id, name, type, time, timezone, days_of_week, day_of_month, month_day, category, prompt_context, auto_approve, active, next_fire)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).bind(
      id,
      sanitize(body.contact_id),
      body.name ? truncate(sanitize(body.name), 100) : null,
      sanitize(body.type),
      sanitize(body.time),
      body.timezone ? truncate(sanitize(body.timezone), 50) : 'America/Los_Angeles',
      body.days_of_week ? (typeof body.days_of_week === 'string' ? body.days_of_week : JSON.stringify(body.days_of_week)) : null,
      body.day_of_month || null,
      body.month_day ? truncate(sanitize(body.month_day), 10) : null,
      body.category ? truncate(sanitize(body.category), 50) : 'general',
      body.prompt_context ? truncate(sanitize(body.prompt_context), 500) : null,
      // HARDCODED: auto_approve is ALWAYS 0. Every message must be manually approved.
      0,
      nextFire
    ).run();

    return Response.json({ id, next_fire: nextFire }, { status: 201 });
  } catch {
    return Response.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
};
