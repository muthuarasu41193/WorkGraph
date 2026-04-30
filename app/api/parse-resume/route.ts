import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getGroqClient } from "../../../lib/groq";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { extractTextFromFile } from "../../../utils/resumeParser";

type ParsedResume = {
  full_name: string;
  email: string;
  headline: string;
  skills: string[];
  experience: string[];
  education: string[];
  links: {
    linkedin: string;
    github: string;
  };
};

function normalizeParsedResume(data: unknown): ParsedResume {
  const fallback: ParsedResume = {
    full_name: "",
    email: "",
    headline: "",
    skills: [],
    experience: [],
    education: [],
    links: { linkedin: "", github: "" },
  };

  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  const links = (obj.links ?? {}) as Record<string, unknown>;

  return {
    full_name: typeof obj.full_name === "string" ? obj.full_name.trim() : "",
    email: typeof obj.email === "string" ? obj.email.trim() : "",
    headline: typeof obj.headline === "string" ? obj.headline.trim() : "",
    skills: Array.isArray(obj.skills)
      ? obj.skills.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
      : [],
    experience: Array.isArray(obj.experience)
      ? obj.experience.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
      : [],
    education: Array.isArray(obj.education)
      ? obj.education.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
      : [],
    links: {
      linkedin: typeof links.linkedin === "string" ? links.linkedin.trim() : "",
      github: typeof links.github === "string" ? links.github.trim() : "",
    },
  };
}

function calculateProfileCompleteness(profile: ParsedResume): number {
  let score = 0;
  const points = {
    full_name: 15,
    email: 20,
    headline: 10,
    skills: 20,
    experience: 15,
    education: 10,
    links: 10,
  };

  if (profile.full_name) score += points.full_name;
  if (profile.email) score += points.email;
  if (profile.headline) score += points.headline;
  if (profile.skills.length > 0) score += points.skills;
  if (profile.experience.length > 0) score += points.experience;
  if (profile.education.length > 0) score += points.education;
  if (profile.links.linkedin || profile.links.github) score += points.links;

  return Math.min(100, score);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const submittedEmail = String(formData.get("email") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded. Use form-data key: file." }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
      return NextResponse.json({ error: "Only PDF or DOCX resumes are supported." }, { status: 400 });
    }

    const resumeText = (await extractTextFromFile(file)).trim();

    if (!resumeText) {
      return NextResponse.json({ error: "Could not extract text from PDF." }, { status: 400 });
    }

    const prompt = `You are a resume parser.
Extract structured data from the resume text below.
Return ONLY valid JSON with this exact shape:
{
  "full_name": "",
  "email": "",
  "headline": "",
  "skills": [],
  "experience": [],
  "education": [],
  "links": { "linkedin": "", "github": "" }
}
If a field is missing, return empty string or empty array.

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
    const parsed = normalizeParsedResume(JSON.parse(content));
    const profileEmail = submittedEmail || parsed.email;
    if (!profileEmail) {
      return NextResponse.json({ error: "Email is required to create profile." }, { status: 400 });
    }

    const profile_completeness = calculateProfileCompleteness(parsed);

    const supabase = createServerSupabaseClient(await cookies());
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          email: profileEmail,
          full_name: parsed.full_name || null,
          headline: parsed.headline || null,
          skills: parsed.skills,
          experience: parsed.experience,
          education: parsed.education,
          linkedin_url: parsed.links.linkedin || null,
          github_url: parsed.links.github || null,
          resume_url: String(formData.get("resume_url") ?? "") || null,
          resume_text: resumeText,
          profile_completeness,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        profile: data,
        parsed_resume: parsed,
        profile_completeness,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error parsing resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
