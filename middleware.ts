import createMiddleware from "next-intl/middleware"
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { routing } from "./i18n/routing"
import { resolveCanonicalHostRedirect } from "./lib/site-url"

const AUTH_PROVIDER = (
  process.env.NEXT_PUBLIC_AUTH_PROVIDER ??
  process.env.AUTH_PROVIDER ??
  "supabase"
).toLowerCase()

const intlMiddleware = createMiddleware(routing)

function supabaseEnvReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  )
}

function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const target = resolveCanonicalHostRedirect({
    hostHeader: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    vercelEnv: process.env.VERCEL_ENV,
  })
  if (!target) return null
  return NextResponse.redirect(target, 308)
}

/**
 * Locale routing first, then refresh auth cookies.
 */
export async function middleware(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request)
  if (hostRedirect) return hostRedirect

  const pathname = request.nextUrl.pathname
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next({ request })
  }

  const response = intlMiddleware(request)

  if (!supabaseEnvReady() && AUTH_PROVIDER === "supertokens") {
    const uri = process.env.SUPERTOKENS_CONNECTION_URI?.trim()
    if (!uri) return response

    try {
      const { initSuperTokensBackend } = await import("./lib/supertokens/backend")
      if (!initSuperTokensBackend()) return response
      const { withSession } = await import("supertokens-node/nextjs")
      return withSession(request, async () => response, { sessionRequired: false })
    } catch {
      return response
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return response

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
