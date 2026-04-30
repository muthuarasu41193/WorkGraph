import Groq from "groq-sdk";

export const GROQ_MODEL = "llama-3.1-70b-versatile";

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
