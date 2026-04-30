import Groq from "groq-sdk";

export function getGroqClient() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("Missing required environment variable: GROQ_API_KEY");
  }

  return new Groq({
    apiKey: groqApiKey,
  });
}
