import { NextResponse } from "next/server";
import { z } from "zod";
import { askJoschaAgent, fallbackAgentAnswer } from "@/lib/agent";

export const runtime = "nodejs";

const requestSchema = z.object({
  question: z.string().trim().min(3).max(500),
});

const requestsByClient = new Map<string, number[]>();
const rateLimitWindowMs = 60_000;
const rateLimitMax = 10;

function isRateLimited(client: string) {
  const now = Date.now();
  const recent = (requestsByClient.get(client) ?? []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs
  );

  if (recent.length >= rateLimitMax) {
    requestsByClient.set(client, recent);
    return true;
  }

  recent.push(now);
  requestsByClient.set(client, recent);
  return false;
}

export async function POST(request: Request) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(client)) {
    return NextResponse.json(
      { error: "Too many questions. Try again in a minute." },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Question must be between 3 and 500 characters." },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await askJoschaAgent(parsed.data.question));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI request failed.";
    console.error("Agent.app OpenAI fallback:", message);
    return NextResponse.json(
      fallbackAgentAnswer(
        parsed.data.question,
        "Live synthesis is temporarily unavailable. Showing the strongest indexed evidence."
      ),
      { status: 200 }
    );
  }
}
