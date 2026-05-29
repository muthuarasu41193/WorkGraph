import { cookies } from "next/headers";
import { getSupabaseSessionUser } from "../route-auth";
import { supabaseConfigured } from "../supabase-enabled";
import { getAuthProvider, supertokensEnabled } from "./config";

export type SessionUser = {
  id: string;
  email: string | null;
  provider: "supabase" | "supertokens";
};

function userIdFromJwtPayload(payload: Record<string, unknown> | undefined): string | null {
  if (!payload) return null;
  const sub = payload.sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

/** Resolve signed-in user for Server Components and Route Handlers. */
export async function getSessionUser(request?: Request): Promise<SessionUser | null> {
  if (supabaseConfigured()) {
    const { data } = await getSupabaseSessionUser(request);
    if (!data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email ?? null,
      provider: "supabase",
    };
  }

  if (supertokensEnabled()) {
    try {
      const { initSuperTokensBackend } = await import("../supertokens/backend");
      initSuperTokensBackend();
      const { getSSRSession } = await import("supertokens-node/nextjs");

      let cookieList: { name: string; value: string }[];
      if (request) {
        cookieList = request.headers
          .get("cookie")
          ?.split(";")
          .map((part) => {
            const [name, ...rest] = part.trim().split("=");
            return { name: name ?? "", value: rest.join("=") };
          })
          .filter((c) => c.name) ?? [];
      } else {
        const cookieStore = await cookies();
        cookieList = cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
      }

      const { accessTokenPayload, hasToken, error } = await getSSRSession(cookieList);
      if (!hasToken || error) return null;

      const userId = userIdFromJwtPayload(accessTokenPayload as Record<string, unknown> | undefined);
      if (!userId) return null;

      const payload = accessTokenPayload as Record<string, unknown> | undefined;
      const email =
        typeof payload?.email === "string"
          ? payload.email
          : typeof payload?.emails === "object" &&
              Array.isArray(payload.emails) &&
              typeof payload.emails[0] === "string"
            ? payload.emails[0]
            : null;

      return { id: userId, email, provider: "supertokens" };
    } catch {
      return null;
    }
  }

  return null;
}

export async function requireSessionUser(request?: Request): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/** Headers for WorkGraph FastAPI BFF proxy calls. */
export async function forwardAuthHeaders(request?: Request): Promise<HeadersInit> {
  const user = await getSessionUser(request);
  if (!user) return {};
  return { "X-User-Id": user.id };
}

export { getAuthProvider };
