import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GROQ_MODEL, getGroqClient } from "../../../lib/groq";
import { parseAssistantJsonObject } from "../../../lib/parseAssistantJson";
import { getBearerToken, getSupabaseSessionUser } from "../../../lib/route-auth";
import {
  atsScoreBodySchema,
  isValidationError,
  parseAiAtsFeedback,
  parseWithSchema,
  publicErrorResponse,
} from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    parseWithSchema(atsScoreBodySchema, rawBody);
    const supabase = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    let userId: string | null = null;

    const bearer = getBearerToken(request);
    if (bearer) {
      const {
        data: { user },
        error: jwtError,
      } = await supabase.auth.getUser(bearer);
      if (!jwtError && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      const {
        data: { user },
        error: sessionError,
      } = await getSupabaseSessionUser(request);
      if (!sessionError && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated. Please sign in and try again." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, resume_raw_text")
      .eq("id", userId)
      .single();
    if (profileError || !profile) {
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

    const groq = getGroqClient();
    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
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
    } catch {
      return NextResponse.json({ error: "Could not score your resume. Please try again." }, { status: 500 });
    }

    const content = completion.choices[0]?.message?.content ?? "{}";
    let atsFeedback: ReturnType<typeof parseAiAtsFeedback>;
    try {
      atsFeedback = parseAiAtsFeedback(parseAssistantJsonObject(content));
    } catch {
      return NextResponse.json({ error: "Could not read the ATS analysis. Please try again." }, { status: 500 });
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
      return NextResponse.json({ error: "Could not save ATS results. Please try again." }, { status: 500 });
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
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid request." });
    }
    return publicErrorResponse(error, { fallback: "Could not score your resume. Please try again." });
  }
}
