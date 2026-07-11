import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  joinWaitlist?: boolean;
};

const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return false;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again in an hour." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as Partial<ContactPayload>;

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";
    const joinWaitlist = Boolean(body.joinWaitlist);

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { ok: false, error: "All required fields must be provided." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Message must be at least 10 characters." },
        { status: 400 },
      );
    }

    const payload: ContactPayload = {
      name,
      email,
      subject,
      message,
      joinWaitlist,
    };

    // TODO: Integrate email service here (Resend, SendGrid, etc.)
    console.log("[contact] New message received:", payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] Failed to process message:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
