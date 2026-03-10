#!/usr/bin/env bun
/**
 * Clawtner → iMessage Bridge
 * 
 * Lightweight HTTP server that receives webhook POSTs from Clawtner
 * and sends messages via the `imsg` CLI.
 * 
 * Usage:
 *   bun run server.ts              # port 3847
 *   PORT=8080 bun run server.ts    # custom port
 * 
 * Clawtner webhook config:
 *   URL: http://localhost:3847/hooks/imessage
 *   Method: POST
 */

const PORT = parseInt(process.env.PORT || '3847');
const SECRET = process.env.WEBHOOK_SECRET || ''; // optional auth

interface WebhookPayload {
  _test?: boolean;
  contact: {
    name: string;
    phone?: string;
    email?: string;
  };
  message: string;
  draft?: {
    id: string;
    status: string;
    category: string;
  };
  gift?: any;
  metadata?: any;
}

async function sendImessage(to: string, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const proc = Bun.spawn(['imsg', 'send', '--to', to, '--text', text], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    if (exitCode === 0 && stdout.trim().toLowerCase().includes('sent')) {
      return { ok: true };
    }
    return { ok: false, error: stderr || stdout || `Exit code ${exitCode}` };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'clawtner-imessage-handler' });
    }

    // Only accept POST to /hooks/imessage
    if (req.method !== 'POST' || url.pathname !== '/hooks/imessage') {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Optional auth
    if (SECRET) {
      const auth = req.headers.get('Authorization');
      if (auth !== `Bearer ${SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    let body: WebhookPayload;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Test ping
    if (body._test) {
      console.log(`[test] Received test webhook for ${body.contact?.name}`);
      return Response.json({ ok: true, test: true });
    }

    // Validate
    const phone = body.contact?.phone;
    if (!phone) {
      return Response.json({ error: 'No phone number on contact' }, { status: 400 });
    }
    if (!body.message) {
      return Response.json({ error: 'No message' }, { status: 400 });
    }

    console.log(`[send] To: ${body.contact.name} (${phone}) | ${body.message.slice(0, 50)}...`);

    const result = await sendImessage(phone, body.message);
    if (result.ok) {
      console.log(`[sent] Delivered to ${body.contact.name}`);
      return Response.json({ ok: true, delivered: true });
    } else {
      console.error(`[fail] ${body.contact.name}: ${result.error}`);
      return Response.json({ ok: false, error: result.error }, { status: 502 });
    }
  },
});

console.log(`Clawtner iMessage handler listening on http://localhost:${PORT}`);
console.log(`Webhook endpoint: http://localhost:${PORT}/hooks/imessage`);
