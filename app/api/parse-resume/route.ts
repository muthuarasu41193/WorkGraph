import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";
import { GROQ_MODEL, getGroqClient } from "../../../lib/groq";
import { parseAssistantJsonObject } from "../../../lib/parseAssistantJson";
import { getBearerToken, getSupabaseSessionUser } from "../../../lib/route-auth";
import { MAX_RESUME_UPLOAD_BYTES, MAX_RESUME_UPLOAD_LABEL } from "../../../lib/upload-limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Resume parsing + Groq can exceed default hobby limits; raise where your plan allows. */
export const maxDuration = 60;

type ParsedEducation = {
  degree: string;
  institution: string;
  year: string;
};

type ParsedWorkExperience = {
  title: string;
  company: string;
  duration: string;
  description: string;
};

type ParsedResume = {
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string;
  summary: string | null;
  years_of_experience: number;
  skills: string[];
  education: ParsedEducation[];
  work_experience: ParsedWorkExperience[];
  certifications: string[];
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
};

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function normalizeParsedResume(data: unknown): ParsedResume {
  const fallback: ParsedResume = {
    full_name: "",
    email: null,
    phone: null,
    location: null,
    headline: "",
    summary: null,
    years_of_experience: 0,
    skills: [],
    education: [],
    work_experience: [],
    certifications: [],
    linkedin_url: null,
    github_url: null,
    website_url: null,
  };

  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;

  return {
    full_name: typeof obj.full_name === "string" ? obj.full_name.trim() : "",
    email: typeof obj.email === "string" ? obj.email.trim() : null,
    phone: typeof obj.phone === "string" ? obj.phone.trim() : null,
    location: typeof obj.location === "string" ? obj.location.trim() : null,
    headline: typeof obj.headline === "string" ? obj.headline.trim() : "",
    summary: typeof obj.summary === "string" ? obj.summary.trim() : null,
    years_of_experience:
      typeof obj.years_of_experience === "number" && Number.isFinite(obj.years_of_experience)
        ? obj.years_of_experience
        : 0,
    skills: Array.isArray(obj.skills)
      ? obj.skills.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean)
      : [],
    education: Array.isArray(obj.education)
      ? obj.education
          .filter((ed): ed is Record<string, unknown> => !!ed && typeof ed === "object")
          .map((ed) => ({
            degree: typeof ed.degree === "string" ? ed.degree.trim() : "",
            institution: typeof ed.institution === "string" ? ed.institution.trim() : "",
            year: typeof ed.year === "string" ? ed.year.trim() : "",
          }))
      : [],
    work_experience: Array.isArray(obj.work_experience)
      ? obj.work_experience
          .filter((wx): wx is Record<string, unknown> => !!wx && typeof wx === "object")
          .map((wx) => ({
            title: typeof wx.title === "string" ? wx.title.trim() : "",
            company: typeof wx.company === "string" ? wx.company.trim() : "",
            duration: typeof wx.duration === "string" ? wx.duration.trim() : "",
            description: typeof wx.description === "string" ? wx.description.trim() : "",
          }))
      : [],
    certifications: Array.isArray(obj.certifications)
      ? obj.certifications
          .filter((c): c is string => typeof c === "string")
          .map((c) => c.trim())
          .filter(Boolean)
      : [],
    linkedin_url: typeof obj.linkedin_url === "string" ? obj.linkedin_url.trim() : null,
    github_url: typeof obj.github_url === "string" ? obj.github_url.trim() : null,
    website_url: typeof obj.website_url === "string" ? obj.website_url.trim() : null,
  };
}

function calculateProfileCompleteness(profile: ParsedResume): number {
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
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_RESUME_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${MAX_RESUME_UPLOAD_LABEL}.` },
        { status: 400 }
      );
    }

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
      } = await getSupabaseSessionUser();
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
      // Lazy-load pdf-parse so this route module can initialize on Vercel without pulling
      // pdfjs-dist into the cold-start graph for non-PDF requests (avoids HTML 500 pages).
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      resumeText = parsed.text?.trim() ?? "";
    } else if (
      lowerName.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const parsed = await mammoth.extractRawText({ buffer });
      resumeText = parsed.value?.trim() ?? "";
    } else {
      return NextResponse.json({ error: "Only PDF and DOCX files are supported" }, { status: 400 });
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
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
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

    let parsedJson: ParsedResume;
    try {
      parsedJson = normalizeParsedResume(parseAssistantJsonObject(content));
    } catch {
      return NextResponse.json({ error: "Failed to parse Groq JSON response" }, { status: 500 });
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
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
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
    const message = error instanceof Error ? error.message : "Unexpected parse error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
