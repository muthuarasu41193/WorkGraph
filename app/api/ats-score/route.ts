import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

type ATSFeedback = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keyword_density: "low" | "medium" | "high";
  formatting_score: number;
  content_score: number;
};

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function getAccessToken(request: Request, cookieStore: Awaited<ReturnType<typeof cookies>>): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieToken = cookieStore.get("sb-access-token")?.value;
  if (cookieToken) return cookieToken;

  const legacyAuth = cookieStore.get("supabase-auth-token")?.value;
  if (!legacyAuth) return null;
  try {
    const parsed = JSON.parse(legacyAuth) as [string, string] | string;
    if (Array.isArray(parsed)) return parsed[0] ?? null;
    if (typeof parsed === "string") return parsed;
  } catch {
    // ignore malformed cookie format
  }
  return null;
}

function normalizeAtsFeedback(input: unknown): ATSFeedback {
  const fallback: ATSFeedback = {
    score: 0,
    grade: "F",
    strengths: [],
    weaknesses: [],
    suggestions: [],
    keyword_density: "low",
    formatting_score: 0,
    content_score: 0,
  };
  if (!input || typeof input !== "object") return fallback;

  const obj = input as Record<string, unknown>;
  const parseScore = (value: unknown): number => {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
  };

  const grade =
    typeof obj.grade === "string" && ["A", "B", "C", "D", "F"].includes(obj.grade.toUpperCase())
      ? (obj.grade.toUpperCase() as ATSFeedback["grade"])
      : "F";
  const density =
    typeof obj.keyword_density === "string" &&
    ["low", "medium", "high"].includes(obj.keyword_density.toLowerCase())
      ? (obj.keyword_density.toLowerCase() as ATSFeedback["keyword_density"])
      : "low";

  const asStringList = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

  return {
    score: parseScore(obj.score),
    grade,
    strengths: asStringList(obj.strengths),
    weaknesses: asStringList(obj.weaknesses),
    suggestions: asStringList(obj.suggestions),
    keyword_density: density,
    formatting_score: parseScore(obj.formatting_score),
    content_score: parseScore(obj.content_score),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { user_id?: string };
    const providedUserId = body.user_id?.trim();
    const cookieStore = await cookies();
    const supabase = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    let userId = providedUserId;
    if (!userId) {
      const accessToken = getAccessToken(request, cookieStore);
      if (accessToken) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser(accessToken);
        if (userError) {
          console.error("ATS API auth session error:", userError);
        }
        userId = user?.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, resume_raw_text")
      .eq("id", userId)
      .single();
    if (profileError || !profile) {
      console.error("ATS API profile fetch error:", profileError);
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const resumeText =
      typeof profile.resume_raw_text === "string" ? profile.resume_raw_text.trim() : "";

    if (!resumeText) {
      return NextResponse.json(
        { error: "No resume found. Please upload your resume first." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert ATS resume analyzer.
         You always respond with valid JSON only.
         No markdown. No code blocks. Just raw JSON.`,
          },
          {
            role: "user",
            content: `Analyze this resume for ATS compatibility.
         Score it from 0-100 based on these criteria:
         
         - Clear section headings (Experience, Education, Skills): 15 points
         - Quantified achievements with numbers and percentages: 20 points
         - Relevant keywords and skills: 20 points
         - Complete contact information: 10 points
         - Professional summary present: 10 points
         - Skills section clearly listed: 15 points
         - Consistent date formatting: 10 points
         
         Return ONLY this JSON:
         {
           "score": 0-100,
           "grade": "A or B or C or D or F",
           "strengths": [
             "specific strength 1",
             "specific strength 2",
             "specific strength 3"
           ],
           "weaknesses": [
             "specific weakness 1",
             "specific weakness 2"
           ],
           "suggestions": [
             "specific actionable improvement 1",
             "specific actionable improvement 2",
             "specific actionable improvement 3"
           ],
           "keyword_density": "low or medium or high",
           "formatting_score": 0-100,
           "content_score": 0-100
         }
         
         Resume:
         ${resumeText}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });
    } catch (error) {
      console.error("Groq API error in ATS route:", error);
      const message = error instanceof Error ? error.message : "Groq API request failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const content = completion.choices[0]?.message?.content ?? "{}";
    let atsFeedback: ATSFeedback;
    try {
      const parsed = JSON.parse(content);
      atsFeedback = normalizeAtsFeedback(parsed);
    } catch (error) {
      console.error("ATS JSON parse error:", error, "Raw content:", content);
      return NextResponse.json({ error: "Failed to parse ATS analysis JSON response" }, { status: 500 });
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        ats_score: atsFeedback.score,
        ats_feedback: atsFeedback,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("ATS profile update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        ...atsFeedback,
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected ATS route error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error while scoring resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
