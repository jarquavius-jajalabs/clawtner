import { Env } from './db';

interface WebhookPayload {
  contact: any;
  message: string;
  draft?: any;
  gift?: any;
  metadata?: any;
}

export async function fireWebhook(
  db: D1Database,
  contactId: string,
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string }> {
  const channels = await db
    .prepare('SELECT * FROM channels WHERE active = 1')
    .all<any>();

  const matched = channels.results?.filter((ch: any) => {
    try {
      const ids = JSON.parse(ch.contact_ids || '[]');
      return ids.includes(contactId);
    } catch {
      return false;
    }
  });

  if (!matched || matched.length === 0) {
    return { success: true }; // no channels configured, not an error
  }

  const errors: string[] = [];
  for (const channel of matched) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(channel.headers ? JSON.parse(channel.headers) : {}),
    };

    let lastError = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const delay = attempt === 0 ? 0 : Math.pow(5, attempt) * 1000;
        if (delay > 0) await new Promise((r) => setTimeout(r, delay));

        const res = await fetch(channel.url, {
          method: channel.method || 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          lastError = '';
          break;
        }
        lastError = `HTTP ${res.status}: ${await res.text()}`;
      } catch (e: any) {
        lastError = e.message || 'Network error';
      }
    }

    if (lastError) {
      errors.push(`${channel.name}: ${lastError}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join('; ') };
  }
  return { success: true };
}
