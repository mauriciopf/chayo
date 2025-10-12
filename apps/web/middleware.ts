import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const intlMiddleware = createIntlMiddleware({
  locales: ["es"],
  defaultLocale: "es",
  localePrefix: "always",
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  // Run i18n middleware first
  const intlResponse = intlMiddleware(request);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (newCookies) => {
          newCookies.forEach(({ name, value, options }) => {
            intlResponse.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  await supabase.auth.getUser(); // ✅ refresh session if needed
  return intlResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files (with extensions), API routes, and Next.js internals
    "/((?!_next/|_vercel/|api/|.*\\.[^/]+$).*)",
  ],
};
