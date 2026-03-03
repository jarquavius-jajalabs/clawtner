import { Env } from '../../lib/db';
import { verifyPin, createSessionToken } from '../../lib/auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{ pin: string }>();
  if (!body?.pin) {
    return Response.json({ error: 'PIN required' }, { status: 400 });
  }

  const valid = await verifyPin(body.pin, context.env.AUTH_PIN_HASH);
  if (!valid) {
    return Response.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  const token = await createSessionToken(context.env.JWT_SECRET || 'dev-secret');
  return Response.json({ token });
};
