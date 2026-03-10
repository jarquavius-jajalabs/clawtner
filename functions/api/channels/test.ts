import { Env } from '../../lib/db';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<{ channel_id: string }>();
  if (!body?.channel_id) {
    return Response.json({ error: 'channel_id required' }, { status: 400 });
  }

  const channel = await context.env.CLAWTNER_DB.prepare(
    'SELECT * FROM channels WHERE id = ?'
  ).bind(body.channel_id).first<any>();

  if (!channel) {
    return Response.json({ error: 'Channel not found' }, { status: 404 });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(channel.headers ? JSON.parse(channel.headers) : {}),
  };

  const testPayload = {
    _test: true,
    contact: { name: 'Test Contact', phone: '+10000000000' },
    message: 'This is a test message from Clawtner to verify your webhook is working.',
    draft: { id: 'test', status: 'approved', category: 'test' },
  };

  try {
    const res = await fetch(channel.url, {
      method: channel.method || 'POST',
      headers,
      body: JSON.stringify(testPayload),
    });

    if (res.ok) {
      return Response.json({ success: true, status: res.status });
    } else {
      const text = await res.text();
      return Response.json({
        success: false,
        status: res.status,
        error: text.slice(0, 500),
      });
    }
  } catch (e: any) {
    return Response.json({
      success: false,
      error: e.message || 'Network error',
    });
  }
};
