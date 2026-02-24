import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

/**
 * OAuth / magic link callback. Runs on the server: exchanges code for session,
 * sets cookies, redirects. No client-side code needed.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;

  if (error) {
    const message = errorDescription ?? "Authentication failed";
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(message)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("Invalid authentication link")}`);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent("Server configuration error")}`);
  }

  const redirectTo = NextResponse.redirect(`${origin}/`);

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectTo.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  return redirectTo;
}
