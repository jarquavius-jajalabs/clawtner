import { Env } from './db';

export interface ImessageSendResult {
  success: boolean;
  error?: string;
}

// For now, this queues the message. The actual sending happens
// via a local cron/worker on the Mac mini that polls approved messages
// and runs `imsg send --to <phone> --text <message>`
//
// The Cloudflare worker just marks messages as "approved" in D1.
// A local script on the Mac mini polls for approved messages and sends them.
export async function markForImessageSend(
  db: D1Database,
  historyId: string,
  contactId: string,
  phone: string,
  message: string
): Promise<ImessageSendResult> {
  try {
    // Insert into message_log with status 'queued' and channel 'imessage'
    const logId = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO message_log (id, history_id, to_number, channel, status)
       VALUES (?, ?, ?, 'imessage', 'queued')`
    ).bind(logId, historyId, phone).run();

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to queue' };
  }
}
