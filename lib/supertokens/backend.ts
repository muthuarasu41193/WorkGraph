import SuperTokens from "supertokens-node";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import Session from "supertokens-node/recipe/session";
import { supertokensAppInfo } from "./appInfo";

let initialized = false;

export function initSuperTokensBackend(): void {
  if (initialized) return;

  const connectionURI = process.env.SUPERTOKENS_CONNECTION_URI?.trim();
  if (!connectionURI) {
    throw new Error("SUPERTOKENS_CONNECTION_URI is required when AUTH_PROVIDER=supertokens");
  }

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
}
