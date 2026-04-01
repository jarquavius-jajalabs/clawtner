import { Env } from '../../lib/db';

// Demo login — only works when no AUTH_PIN_HASH is set
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    if (context.env.AUTH_PIN_HASH) {
      return Response.json({ error: 'Demo mode disabled' }, { status: 403 });
    }
    return Response.json({ token: 'demo', demo: true });
  } catch {
    return Response.json({ error: 'Demo login failed' }, { status: 500 });
  }
};
