import { Env } from '../lib/db';

// Seed demo data — only works when no AUTH_PIN_HASH is set
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (context.env.AUTH_PIN_HASH) {
    return Response.json({ error: 'Seed disabled in production' }, { status: 403 });
  }

  const db = context.env.CLAWTNER_DB;

  // Check if already seeded
  const existing = await db.prepare('SELECT COUNT(*) as c FROM contacts').first<{c: number}>();
  if (existing && existing.c > 0) {
    return Response.json({ ok: true, message: 'Already seeded' });
  }

  // Contacts
  await db.batch([
    db.prepare(`INSERT INTO contacts (id, name, phone, relationship, tone, address_line1, city, state, zip, gift_preferences)
      VALUES ('darcie', 'Darcie', '+19517641875', 'partner', 'warm, loving', '123 Main St', 'Temecula', 'CA', '92591', 'Loves sunflowers and peonies. Allergic to lilies.')`),
    db.prepare(`INSERT INTO contacts (id, name, phone, relationship, tone, address_line1, city, state, zip)
      VALUES ('mom', 'Mom', '+15551234567', 'parent', 'caring, respectful', '456 Oak Ave', 'Tampa', 'FL', '33601')`),
    db.prepare(`INSERT INTO contacts (id, name, email, relationship, tone)
      VALUES ('dave', 'Dave Cutts', 'dave@example.com', 'parent', 'professional, friendly')`),
  ]);

  // Pending drafts
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare(`INSERT INTO drafts (id, contact_id, message, category, metadata, created_at)
      VALUES ('draft-1', 'darcie', 'Hey babe, just wanted to say you make every day better. Thinking about you right now.', 'love_note', '{"agent":"openclaw","context":"afternoon check-in"}', ?)`).bind(now - 300),
    db.prepare(`INSERT INTO drafts (id, contact_id, message, category, metadata, created_at)
      VALUES ('draft-2', 'mom', 'Hey Mom, just checking in. How are you doing? We should catch up this weekend if you are free.', 'check_in', '{"agent":"openclaw"}', ?)`).bind(now - 600),
    db.prepare(`INSERT INTO drafts (id, contact_id, message, category, metadata, created_at)
      VALUES ('draft-3', 'darcie', 'Quick reminder: we have that dinner reservation Saturday at 7. Want me to pick anything up on the way home?', 'reminder', '{"agent":"openclaw"}', ?)`).bind(now - 120),
  ]);

  // Pending gift
  await db.prepare(`INSERT INTO gifts (id, contact_id, product_id, product_name, product_image, product_price, delivery_date, message_card, recipient_name, recipient_address, created_at)
    VALUES ('gift-1', 'darcie', 'sunflower-bouquet', 'Sunshine Sunflowers', 'https://images.unsplash.com/photo-1551927336-09d50efd69cd?w=400', 39.99, '2026-03-07', 'Just because you deserve something beautiful today.', 'Darcie', '{"line1":"123 Main St","city":"Temecula","state":"CA","zip":"92591"}', ?)`).bind(now - 60);

  // Some history
  await db.batch([
    db.prepare(`INSERT INTO history (id, contact_id, message, status, created_at)
      VALUES ('hist-1', 'darcie', 'Good morning beautiful. Hope your day is as amazing as you are.', 'sent', ?)`).bind(now - 86400),
    db.prepare(`INSERT INTO history (id, contact_id, message, status, created_at)
      VALUES ('hist-2', 'darcie', 'Picking up groceries on my way home. Need anything?', 'sent', ?)`).bind(now - 43200),
    db.prepare(`INSERT INTO history (id, contact_id, message, status, created_at)
      VALUES ('hist-3', 'mom', 'Happy birthday Mom! Love you so much. Lets do dinner soon.', 'sent', ?)`).bind(now - 172800),
  ]);

  return Response.json({ ok: true, message: 'Demo data seeded' });
};
