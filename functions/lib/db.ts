export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** Strip HTML/script tags from user input */
export function sanitize(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/** Validate phone number: must start with + and have 10+ digits */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // phone is optional
  const digits = phone.replace(/[^\d]/g, '');
  return phone.startsWith('+') && digits.length >= 10;
}

/** Truncate string to maxLen */
export function truncate(s: string | null | undefined, maxLen: number): string {
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/** Add CORS headers to a response */
export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', 'https://clawtner.pages.dev');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export type Env = {
  CLAWTNER_DB: D1Database;
  FLORISTONE_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  AUTH_PIN_HASH?: string;
  JWT_SECRET?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  ANTHROPIC_API_KEY?: string;
};
