import { verifyApiKey, verifySession } from '../lib/auth';
import { Env } from '../lib/db';

// Routes that don't need auth
const PUBLIC_ROUTES = ['/api/auth/pin', '/api/auth/demo'];

export const onRequest: PagesFunction<Env>[] = [
  async (context) => {
    const url = new URL(context.request.url);

    // CORS for local dev
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (PUBLIC_ROUTES.includes(url.pathname)) {
      return context.next();
    }

    const auth = context.request.headers.get('Authorization');

    // Demo mode: if no PIN hash is configured, allow demo token
    if (!context.env.AUTH_PIN_HASH) {
      if (auth?.includes('demo')) {
        return context.next();
      }
    }

    // Try API key auth first
    if (auth?.startsWith('Bearer ')) {
      const result = await verifyApiKey(context.env.CLAWTNER_DB, auth);
      if (result.valid) {
        return context.next();
      }

      // Try session token
      const token = auth.slice(7);
      const valid = await verifySession(token, context.env.JWT_SECRET);
      if (valid) {
        return context.next();
      }
    }

    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  },
];
