import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getGroqClient } from "../../../lib/groq";
import { createServerSupabaseClient } from "../../../lib/supabase";

type AtsResult = {
  score: number;
  strengths: string[];
  weaknesses: string[];
};

function normalizeAtsResult(input: unknown): AtsResult {
  const fallback: AtsResult = { score: 0, strengths: [], weaknesses: [] };
  if (!input || typeof input !== "object") return fallback;

  const obj = input as Record<string, unknown>;
  const rawScore = typeof obj.score === "number" ? obj.score : Number(obj.score ?? 0);

  return {
    score: Math.max(0, Math.min(100, Number.isFinite(rawScore) ? Math.round(rawScore) : 0)),
    strengths: Array.isArray(obj.strengths)
      ? obj.strengths.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
      : [],
    weaknesses: Array.isArray(obj.weaknesses)
      ? obj.weaknesses.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
      : [],
  };
}

function buildResumeText(profile: Record<string, unknown>): string {
  if (typeof profile.resume_text === "string" && profile.resume_text.trim()) {
    return profile.resume_text.trim();
  }

  const skills = Array.isArray(profile.skills) ? profile.skills.join(", ") : "";
  const experience = Array.isArray(profile.experience) ? profile.experience.join("\n") : "";
  const education = Array.isArray(profile.education) ? profile.education.join("\n") : "";

  return [
    `Name: ${String(profile.full_name ?? "")}`.trim(),
    `Email: ${String(profile.email ?? "")}`.trim(),
    `Headline: ${String(profile.headline ?? "")}`.trim(),
    `Skills: ${skills}`.trim(),
    `Experience:\n${experience}`.trim(),
    `Education:\n${education}`.trim(),
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; profile_id?: string };
    const email = body.email?.trim();
    const profileId = body.profile_id?.trim();

    if (!email && !profileId) {
      return NextResponse.json(
        { error: "Provide either email or profile_id in request body." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient(await cookies());
    let query = supabase
      .from("profiles")
      .select("id, email, full_name, headline, skills, experience, education, resume_text");

    query = profileId ? query.eq("id", profileId) : query.eq("email", email as string);

    const { data: profile, error: profileError } = await query.single();
    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const resumeText = buildResumeText(profile as Record<string, unknown>);
    if (!resumeText) {
      return NextResponse.json({ error: "No resume text available for scoring." }, { status: 400 });
    }

    const prompt = `You are an ATS evaluator.
Score this resume from 0-100 based on:
1) formatting/readability
2) keyword relevance
3) impact/achievement language

Return ONLY valid JSON with this exact schema:
{
  "score": 0,
  "strengths": [],
  "weaknesses": []
}

Resume text:
${resumeText}`;

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You return strict JSON only." },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const ats = normalizeAtsResult(JSON.parse(content));

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        ats_score: ats.score,
        ats_strengths: ats.strengths,
        ats_weaknesses: ats.weaknesses,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        score: ats.score,
        strengths: ats.strengths,
        weaknesses: ats.weaknesses,
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while scoring resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
