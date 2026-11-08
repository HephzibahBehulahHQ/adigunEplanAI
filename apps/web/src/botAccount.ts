import { z } from "zod";

const authUrl = "https://fqcbfnktdvqojyezxeis.supabase.co/auth/v1";
const sessionSchema = z.object({
  access_token: z.string().min(20).max(4096),
  expires_in: z.number().int().positive().max(86400),
  user: z.object({ is_anonymous: z.literal(false) }),
});

export function isPublishableKey(value: unknown): value is string {
  return typeof value === "string" && /^sb_publishable_[\w-]+$/.test(value);
}

const configuredKey: unknown = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const hostedBotKey =
  import.meta.env.VITE_ADIGUN_HOSTED_HELP === "true" &&
  isPublishableKey(configuredKey)
    ? configuredKey
    : undefined;

export async function signInForBot(
  publishableKey: string,
  email: string,
  password: string,
  signal: AbortSignal,
  request: typeof fetch = fetch,
) {
  if (!isPublishableKey(publishableKey)) throw new Error("unavailable");
  const response = await request(authUrl + "/token?grant_type=password", {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
    signal,
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("signInFailed");
  const session = sessionSchema.parse(await response.json());
  return {
    accessToken: session.access_token,
    expiresAt: Date.now() + session.expires_in * 1000,
  };
}

export async function signOutOfBot(
  publishableKey: string,
  accessToken: string,
) {
  if (!isPublishableKey(publishableKey)) return;
  await fetch(authUrl + "/logout?scope=local", {
    method: "POST",
    headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}` },
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
}
