import { Env } from './db';

export async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyApiKey(
  db: D1Database,
  authHeader: string | null
): Promise<{ valid: boolean; keyId?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }
  const token = authHeader.slice(7);
  const keyHash = await hashKey(token);
  const row = await db
    .prepare('SELECT id FROM api_keys WHERE key_hash = ? AND active = 1')
    .bind(keyHash)
    .first<{ id: string }>();
  if (!row) return { valid: false };
  await db
    .prepare('UPDATE api_keys SET last_used = unixepoch() WHERE id = ?')
    .bind(row.id)
    .run();
  return { valid: true, keyId: row.id };
}

export async function verifyPin(
  pin: string,
  pinHash: string | undefined
): Promise<boolean> {
  if (!pinHash) return false;
  const hashed = await hashKey(pin);
  return hashed === pinHash;
}

export async function createSessionToken(
  secret: string
): Promise<string> {
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
  };
  const encoded = new TextEncoder().encode(
    JSON.stringify(payload) + '.' + secret
  );
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return btoa(JSON.stringify(payload)) +
    '.' +
    Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
}

export async function verifySession(
  token: string,
  secret: string | undefined
): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    const [payloadB64, sig] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    const encoded = new TextEncoder().encode(
      JSON.stringify(payload) + '.' + secret
    );
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    const expected = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return sig === expected;
  } catch {
    return false;
  }
}
