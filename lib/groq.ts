import Groq from "groq-sdk";

/** Production Groq model (3.1 IDs were decommissioned Jan 2025). */
export const GROQ_MODEL = "llama-3.3-70b-versatile";

export function getGroqClient() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("Missing required environment variable: GROQ_API_KEY");
  }

  return new Groq({
    apiKey: groqApiKey,
  });
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY ?? "missing-groq-api-key",
});

export default groq;
