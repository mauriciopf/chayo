'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { Logo } from './Logo';

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createBrowserClient(supabaseUrl, supabaseKey);
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
      const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null);
      });
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Examples', href: '#examples' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-chayo-bg/95 backdrop-blur-sm border-b border-chayo-border' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Logo href="/" size="sm" className="hover:text-chayo-accent transition-colors" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-chayo-muted hover:text-chayo-text transition-colors tracking-wide"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-chayo-muted hover:text-chayo-text transition-colors"
                >
                  Dashboard
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="text-sm text-chayo-muted hover:text-chayo-text transition-colors"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm text-chayo-muted hover:text-chayo-text transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-chayo-text transition-all duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-chayo-text transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-chayo-text transition-all duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      <div
        className={`fixed inset-0 z-40 bg-chayo-bg flex flex-col items-center justify-center gap-8 transition-all duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {navLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className="font-display text-3xl text-chayo-text hover:text-chayo-accent transition-colors"
          >
            {l.label}
          </a>
        ))}
        <div className="mt-4 flex flex-col items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="text-chayo-muted text-lg hover:text-chayo-text transition-colors">
                Dashboard
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-chayo-muted text-lg hover:text-chayo-text transition-colors">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link href="/auth/login" onClick={() => setOpen(false)} className="text-chayo-muted text-lg hover:text-chayo-text transition-colors">
              Login
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
