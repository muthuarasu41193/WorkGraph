"use client";

import SuperTokensReact from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";
import { supertokensAppInfo } from "./appInfo";

let initialized = false;

export function initSuperTokensFrontend(): void {
  if (typeof window === "undefined" || initialized) return;

  SuperTokensReact.init({
    appInfo: supertokensAppInfo,
    recipeList: [EmailPassword.init(), Session.init()],
  });

  initialized = true;
}
