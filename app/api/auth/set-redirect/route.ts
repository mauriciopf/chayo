import { NextResponse, type NextRequest } from 'next/server';

// Stores the OAuth redirect intent in a short-lived httpOnly cookie
// so it survives the Google OAuth redirect cycle.
export async function POST(request: NextRequest) {
  const { next } = await request.json();

  // Validate: only allow relative paths to prevent open redirect
  const safePath =
    typeof next === 'string' && next.startsWith('/')
      ? next
      : '/dashboard';

  const response = NextResponse.json({ ok: true });
  response.cookies.set('chayo-redirect-to', safePath, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 300, // 5 minutes
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
