'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get('next') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      router.push(next);
    }
  }

  async function handleGoogleLogin() {
    await fetch('/api/auth/set-redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next }),
    });
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-chayo-text mb-2">Create your account.</h1>
        <p className="text-chayo-muted text-sm font-sans">
          Already have an account?{' '}
          <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="text-chayo-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-chayo-border text-chayo-text text-sm font-sans rounded-sm hover:border-chayo-accent transition-colors mb-6 min-h-[52px]"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-chayo-border" />
        <span className="text-chayo-muted text-xs font-sans">or</span>
        <div className="flex-1 h-px bg-chayo-border" />
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {error && (
          <p className="text-red-400 text-sm font-sans bg-red-400/10 px-4 py-3 rounded-sm">{error}</p>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-chayo-muted text-xs tracking-wide uppercase font-sans">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 bg-chayo-surface border border-chayo-border text-chayo-text text-base font-sans rounded-sm focus:border-chayo-accent focus:outline-none transition-colors placeholder:text-chayo-muted/50"
            placeholder="you@brand.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-chayo-muted text-xs tracking-wide uppercase font-sans">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-chayo-surface border border-chayo-border text-chayo-text text-base font-sans rounded-sm focus:border-chayo-accent focus:outline-none transition-colors placeholder:text-chayo-muted/50"
            placeholder="Min. 8 characters"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-4 bg-chayo-accent text-chayo-bg font-sans font-semibold text-sm tracking-wide rounded-sm hover:bg-chayo-accent-hover active:scale-[0.98] transition-all duration-150 min-h-[52px] disabled:opacity-60 mt-2"
        >
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-chayo-bg flex flex-col items-center justify-center px-5 py-16">
      <Logo href="/" size="lg" className="mb-16 hover:text-chayo-accent transition-colors" />
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  );
}
