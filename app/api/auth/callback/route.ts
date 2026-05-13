import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  const cookieStore = await cookies();

  // Read and clear the stored redirect intent (set before OAuth)
  const redirectTo = cookieStore.get('chayo-redirect-to')?.value ?? '/dashboard';

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${redirectTo}`);
      // Clear the redirect cookie
      response.cookies.set('chayo-redirect-to', '', { maxAge: 0, path: '/' });
      return response;
    }
  }

  // Fallback on error
  return NextResponse.redirect(`${origin}/auth/login`);
}
