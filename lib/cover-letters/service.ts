import { getGroqClient, GROQ_MODEL } from "@/lib/groq";

export type GenerateCoverLetterParams = {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resumeText: string;
};

export async function generateCoverLetter(
  params: GenerateCoverLetterParams,
): Promise<string> {
  const jobTitle = params.jobTitle.trim();
  const company = params.company.trim();
  const jobDescription = params.jobDescription.trim();
  const resumeText = params.resumeText.trim();

  if (!jobTitle || !company || !resumeText) {
    throw new Error(
      "Cover letter generation requires a job title, company, and candidate background.",
    );
  }

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a professional career coach. Generate a compelling cover letter for a ${jobTitle} position at ${company}. Job description: ${jobDescription}. Candidate's background: ${resumeText}. Write in first person, 3-4 paragraphs, professional tone.`,
        },
      ],
    });

    const letter = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!letter) {
      throw new Error("Cover letter generation returned an empty response. Please try again.");
    }

    return letter;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Cover letter generation")) {
      throw error;
    }

    const raw = error instanceof Error ? error.message : "Unknown error";
    if (raw.includes("GROQ_API_KEY")) {
      throw new Error("Cover letter generation is not configured on this server.");
    }

    throw new Error("Cover letter generation failed. Please try again.");
  }
}
