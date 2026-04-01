import { verifyApiKey, verifySession } from '../lib/auth';
import { Env, withCors } from '../lib/db';

// Routes that don't need auth
const PUBLIC_ROUTES = ['/api/auth/pin', '/api/auth/demo', '/api/messages/webhook'];

export const onRequest: PagesFunction<Env>[] = [
  async (context) => {
    const url = new URL(context.request.url);

    // CORS preflight
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://clawtner.pages.dev',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (PUBLIC_ROUTES.includes(url.pathname)) {
      const response = await context.next();
      return withCors(response);
    }

    const auth = context.request.headers.get('Authorization');

    // Demo mode: if no PIN hash is configured, allow demo token
    if (!context.env.AUTH_PIN_HASH) {
      if (auth?.includes('demo')) {
        const response = await context.next();
        return withCors(response);
      }
    }

    // Try API key auth first
    if (auth?.startsWith('Bearer ')) {
      const result = await verifyApiKey(context.env.CLAWTNER_DB, auth);
      if (result.valid) {
        const response = await context.next();
        return withCors(response);
      }

      // Try session token
      const token = auth.slice(7);
      const valid = await verifySession(token, context.env.JWT_SECRET);
      if (valid) {
        const response = await context.next();
        return withCors(response);
      }
    }

    return withCors(
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  },
];
