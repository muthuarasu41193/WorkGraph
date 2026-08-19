import { GROQ_MODEL, getGroqClient } from "@/lib/groq";
import { parseAssistantJsonObject } from "@/lib/parseAssistantJson";

const MAX_RESUME_CHARS = 24_000;

/**
 * Untrusted structured extract. Output is schema-validated and grounded later.
 * Never log the prompt or completion body (resume PII).
 */
export async function extractStructuredResumeWithGroq(normalizedText: string): Promise<unknown> {
  const groq = getGroqClient();
  const resumeText = normalizedText.slice(0, MAX_RESUME_CHARS);

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.1,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You extract facts from resumes into JSON.
Rules:
- Use only information explicitly present in the resume. Do not invent employers, dates, skills, degrees, projects, or achievements.
- If a field is not present, use null or [].
- Never infer or output protected characteristics: race, ethnicity, religion, caste, gender, sex, age, date of birth, sexual orientation, health/disability, pregnancy, citizenship, national origin, political affiliation, marital status.
- Do not guess age from graduation years.
- Return JSON only.`,
      },
      {
        role: "user",
        content: `Parse this resume into JSON with this shape:
{
  "full_name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "headline": "string or null",
  "summary": "string or null",
  "years_of_experience": number or null,
  "skills": ["skill"],
  "technical_skills": ["skill"],
  "soft_skills": ["skill"],
  "education": [{"degree":"","institution":"","year":""}],
  "work_experience": [{"title":"","company":"","duration":"","description":""}],
  "certifications": ["name"],
  "projects": [{"name":"","description":""}],
  "achievements": ["text"],
  "industries": ["industry"],
  "locations": ["location"],
  "target_roles": ["role"],
  "linkedin_url": "string or null",
  "github_url": "string or null",
  "website_url": "string or null",
  "employment_preferences": {
    "location_mode": "remote|hybrid|onsite|any or null",
    "job_types": ["Full-time"],
    "willing_to_relocate": true or null,
    "notes": ["only phrases from the resume"]
  },
  "skill_confidences": [{"skill":"Python","confidence":0.97}]
}

Resume:
${resumeText}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  return parseAssistantJsonObject(content);
}
