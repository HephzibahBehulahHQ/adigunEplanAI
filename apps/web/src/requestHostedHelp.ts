import { z } from "zod";

const hostedSources = z.object({
  sources: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        excerpt: z.string().min(1).max(1100),
        document: z.literal("HELP.md"),
      }),
    )
    .max(3),
});

export class HostedBotError extends Error {
  readonly code: "signedOut" | "rateLimited" | "unavailable";
  constructor(code: HostedBotError["code"]) {
    super(code);
    this.code = code;
  }
}

export async function requestHostedHelp(
  question: string,
  accessToken: string,
  signal: AbortSignal,
  request: typeof fetch = fetch,
) {
  const text = question.trim();
  if (!accessToken) throw new HostedBotError("signedOut");
  if (!text || text.length > 500) throw new HostedBotError("unavailable");
  try {
    const response = await request("/api/adigun-bot/help", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: text }),
      redirect: "error",
      cache: "no-store",
      signal,
    });
    if (response.status === 401) throw new HostedBotError("signedOut");
    if (response.status === 429) throw new HostedBotError("rateLimited");
    if (!response.ok) throw new HostedBotError("unavailable");
    return hostedSources.parse(await response.json()).sources;
  } catch (error) {
    if (error instanceof HostedBotError) throw error;
    throw new HostedBotError("unavailable");
  }
}
