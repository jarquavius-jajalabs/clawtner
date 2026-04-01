import { Env } from '../../lib/db';
import { verifyPin, createSessionToken } from '../../lib/auth';

// Simple rate limiting: track failed attempts per IP via D1
// After 5 failures within 30 seconds, block for 30 seconds
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 30;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<{ pin: string }>().catch(() => null);
    if (!body?.pin) {
      return Response.json({ error: 'PIN required' }, { status: 400 });
    }

    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - WINDOW_SECONDS;

    // Check recent failed attempts for this IP
    try {
      // Ensure table exists (idempotent)
      await context.env.CLAWTNER_DB.prepare(
        `CREATE TABLE IF NOT EXISTS pin_attempts (id TEXT PRIMARY KEY, ip TEXT, attempted_at INTEGER)`
      ).run();

      // Clean old entries
      await context.env.CLAWTNER_DB.prepare(
        'DELETE FROM pin_attempts WHERE attempted_at < ?'
      ).bind(windowStart).run();

      // Count recent failures
      const countResult = await context.env.CLAWTNER_DB.prepare(
        'SELECT COUNT(*) as cnt FROM pin_attempts WHERE ip = ? AND attempted_at >= ?'
      ).bind(ip, windowStart).first<{ cnt: number }>();

      if (countResult && countResult.cnt >= MAX_ATTEMPTS) {
        return Response.json(
          { error: 'Too many attempts. Try again in 30 seconds.' },
          { status: 429 }
        );
      }
    } catch {
      // If rate limit table fails, continue without rate limiting
    }

    const valid = await verifyPin(body.pin, context.env.AUTH_PIN_HASH);
    if (!valid) {
      // Log failed attempt
      try {
        await context.env.CLAWTNER_DB.prepare(
          'INSERT INTO pin_attempts (id, ip, attempted_at) VALUES (?, ?, ?)'
        ).bind(crypto.randomUUID(), ip, now).run();
      } catch {
        // Non-critical
      }
      return Response.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const token = await createSessionToken(context.env.JWT_SECRET || 'dev-secret');
    return Response.json({ token });
  } catch {
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
};
