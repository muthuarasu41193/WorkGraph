import SuperTokens from "supertokens-node";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import Session from "supertokens-node/recipe/session";
import { supertokensAppInfo } from "./appInfo";

let initialized = false;

/** Returns false when SuperTokens env is incomplete (safe during build and on Vercel). */
export function initSuperTokensBackend(): boolean {
  if (initialized) return true;

  const connectionURI = process.env.SUPERTOKENS_CONNECTION_URI?.trim();
  if (!connectionURI) return false;

  SuperTokens.init({
    appInfo: supertokensAppInfo,
    supertokens: {
      connectionURI,
      apiKey: process.env.SUPERTOKENS_API_KEY?.trim() || undefined,
    },
    recipeList: [
      EmailPassword.init(),
      Session.init({
        cookieSecure: process.env.NODE_ENV === "production",
        cookieSameSite: "lax",
      }),
    ],
  });

  initialized = true;
  return true;
}
