import { Env } from './db';

interface TwilioSendResult {
  success: boolean;
  sid?: string;
  error?: string;
  errorCode?: string;
}

export async function sendSMS(
  env: Env,
  to: string,
  body: string
): Promise<TwilioSendResult> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return { success: false, error: 'Twilio not configured' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const params = new URLSearchParams({
    To: to,
    From: TWILIO_FROM_NUMBER,
    Body: body,
  });

  // Add status callback if we have a public URL
  // params.append('StatusCallback', 'https://clawtner.pages.dev/api/messages/webhook');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json() as any;

    if (res.ok) {
      return { success: true, sid: data.sid };
    } else {
      return {
        success: false,
        error: data.message || `HTTP ${res.status}`,
        errorCode: data.code?.toString(),
      };
    }
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}

export async function sendWhatsApp(
  env: Env,
  to: string,
  body: string
): Promise<TwilioSendResult> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { success: false, error: 'Twilio not configured' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const params = new URLSearchParams({
    To: `whatsapp:${to}`,
    From: `whatsapp:${TWILIO_FROM_NUMBER}`,
    Body: body,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json() as any;

    if (res.ok) {
      return { success: true, sid: data.sid };
    } else {
      return { success: false, error: data.message || `HTTP ${res.status}` };
    }
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}
