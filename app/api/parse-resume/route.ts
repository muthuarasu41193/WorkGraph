import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";
import { GROQ_MODEL, getGroqClient } from "../../../lib/groq";
import { parseAssistantJsonObject } from "../../../lib/parseAssistantJson";
import { getBearerToken, getSupabaseSessionUser } from "../../../lib/route-auth";
import {
  isValidationError,
  parseAiParsedResume,
  parseResumeUploadFile,
  publicErrorResponse,
} from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Resume parsing + Groq can exceed default hobby limits; raise where your plan allows. */
export const maxDuration = 60;

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function calculateProfileCompleteness(profile: ReturnType<typeof parseAiParsedResume>): number {
  let score = 0;

  if (profile.full_name) score += 15;
  if (profile.headline) score += 10;
  if (profile.summary) score += 10;
  if (profile.skills.length >= 3) score += 15;
  if (profile.work_experience.length >= 1) score += 20;
  if (profile.education.length >= 1) score += 15;
  if (profile.phone) score += 5;
  if (profile.location) score += 5;
  if (profile.certifications.length > 0) score += 5;

  return Math.min(100, score);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = parseResumeUploadFile(formData.get("file"));

    const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRole = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    let userId: string | null = null;
    let sessionEmail: string | null = null;

    const bearer = getBearerToken(request);
    if (bearer) {
      const {
        data: { user },
        error: jwtError,
      } = await supabaseAdmin.auth.getUser(bearer);
      if (!jwtError && user) {
        userId = user.id;
        sessionEmail = user.email ?? null;
      }
    }

    if (!userId) {
      const {
        data: { user },
        error: sessionError,
      } = await getSupabaseSessionUser(request);
      if (!sessionError && user) {
        userId = user.id;
        sessionEmail = user.email ?? null;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated. Please sign in and try again." },
        { status: 401 }
      );
    }

    const lowerName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let resumeText = "";

    if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
      // Lazy-load pdf-parse only when needed to keep cold starts lighter.
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      resumeText = parsed.text?.trim() ?? "";
    } else {
      const parsed = await mammoth.extractRawText({ buffer });
      resumeText = parsed.value?.trim() ?? "";
    }

    const textSample = resumeText.replace(/\s+/g, " ").trim();
    if (textSample.length < 24) {
      return NextResponse.json(
        {
          error:
            "We could not extract enough text from this file. Try another PDF/DOCX export, or enter your profile manually.",
        },
        { status: 422 }
      );
    }

    const storagePath = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error: uploadError } = await supabaseAdmin.storage.from("resumes").upload(storagePath, file, {
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: "Could not store your resume. Please try again." }, { status: 500 });
    }
    const { data: publicUrlData } = supabaseAdmin.storage.from("resumes").getPublicUrl(storagePath);
    const resumeUrl = publicUrlData.publicUrl;

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a professional resume parser.
         You always respond with valid JSON only.
         Never include markdown, code blocks, or explanations.`,
        },
        {
          role: "user",
          content: `Parse this resume and return ONLY this JSON structure
         with no other text:
         {
           "full_name": "string",
           "email": "string or null",
           "phone": "string or null",
           "location": "string or null",
           "headline": "their professional job title",
           "summary": "professional summary or null",
           "years_of_experience": number,
           "skills": ["skill1", "skill2"],
           "education": [
             {
               "degree": "string",
               "institution": "string",
               "year": "string"
             }
           ],
           "work_experience": [
             {
               "title": "string",
               "company": "string",
               "duration": "string",
               "description": "string"
             }
           ],
           "certifications": ["cert1", "cert2"],
           "linkedin_url": "string or null",
           "github_url": "string or null",
           "website_url": "string or null"
         }

         Resume text:
         ${resumeText}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    let parsedJson: ReturnType<typeof parseAiParsedResume>;
    try {
      parsedJson = parseAiParsedResume(parseAssistantJsonObject(content));
    } catch {
      return NextResponse.json({ error: "Could not read the resume analysis. Please try again." }, { status: 500 });
    }

    const profile_completeness = calculateProfileCompleteness(parsedJson);

    const formEmail = formData.get("email");
    const emailOverride =
      typeof formEmail === "string" && formEmail.trim() ? formEmail.trim() : null;

    const { error: upsertError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email: parsedJson.email ?? emailOverride ?? sessionEmail,
        full_name: parsedJson.full_name || null,
        phone: parsedJson.phone,
        location: parsedJson.location,
        headline: parsedJson.headline || null,
        summary: parsedJson.summary,
        years_of_experience: parsedJson.years_of_experience ?? null,
        skills: parsedJson.skills,
        education: parsedJson.education,
        work_experience: parsedJson.work_experience,
        certifications: parsedJson.certifications,
        linkedin_url: parsedJson.linkedin_url,
        github_url: parsedJson.github_url,
        website_url: parsedJson.website_url,
        resume_raw_text: resumeText,
        resume_url: resumeUrl,
        profile_completeness,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        profile: {
          ...parsedJson,
          resume_url: resumeUrl,
          resume_raw_text: resumeText,
        },
        profile_completeness,
      },
      { status: 200 }
    );
  } catch (error) {
    if (isValidationError(error)) {
      return publicErrorResponse(error, { fallback: "Invalid resume upload." });
    }
    return publicErrorResponse(error, { fallback: "Could not parse your resume. Please try again." });
  }
}
