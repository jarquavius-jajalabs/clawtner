export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): number {
  return Math.floor(Date.now() / 1000);
}

export type Env = {
  CLAWTNER_DB: D1Database;
  FLORISTONE_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  AUTH_PIN_HASH?: string;
  JWT_SECRET?: string;
};
