'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

function useSubscriptionStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [active, setActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    supabase.auth.getUser().then(async ({ data }) => {
      const currentUser = data.user;
      setUser(currentUser);

      if (currentUser) {
        try {
          const res = await fetch('/api/subscriptions/status');
          if (res.ok) {
            const json = await res.json();
            setActive(json.active === true);
          } else {
            setActive(false);
          }
        } catch {
          setActive(false);
        }
      }
      setLoading(false);
    });
  }, []);

  return { user, active, loading };
}

function StartMembershipButton() {
  const { user, active, loading } = useSubscriptionStatus();
  const [redirecting, setRedirecting] = useState(false);

  async function handleClick() {
    if (!user) {
      window.location.href = '/auth/login?next=/dashboard/membership';
      return;
    }
    if (active) {
      window.location.href = '/dashboard/membership';
      return;
    }
    setRedirecting(true);
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      setRedirecting(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full sm:w-auto px-8 py-4 bg-chayo-border rounded-sm animate-pulse min-h-[52px]" />
    );
  }

  if (active) {
    return (
      <a
        href="/dashboard/membership"
        className="w-full sm:w-auto px-8 py-4 bg-chayo-accent text-chayo-bg font-sans font-semibold text-base tracking-wide rounded-sm hover:bg-chayo-accent-hover active:scale-[0.98] transition-all duration-150 min-h-[52px] flex items-center justify-center"
      >
        Manage Subscription →
      </a>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={redirecting}
      className="w-full sm:w-auto px-8 py-4 bg-chayo-accent text-chayo-bg font-sans font-semibold text-base tracking-wide rounded-sm hover:bg-chayo-accent-hover active:scale-[0.98] transition-all duration-150 min-h-[52px] flex items-center justify-center disabled:opacity-60"
    >
      {redirecting ? 'Redirecting…' : 'Start Membership'}
    </button>
  );
}

export function MembershipSection() {
  return (
    <section id="pricing" className="section-pad bg-chayo-bg">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Heading */}
        <div className="max-w-xl mb-12 sm:mb-16">
          <p className="text-chayo-accent text-xs tracking-[0.25em] uppercase mb-4 font-sans">
            Membership
          </p>
          <h2 className="font-display text-display-lg text-chayo-text text-balance">
            One simple plan.
            <br />
            Weekly results.
          </h2>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-chayo-border max-w-3xl">
          {/* Basic */}
          <div className="bg-chayo-surface p-8 sm:p-10 flex flex-col gap-6">
            <div>
              <p className="text-chayo-accent text-xs tracking-[0.2em] uppercase font-sans mb-3">Creator Plan</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display text-4xl text-chayo-text">$499</span>
                <span className="text-chayo-muted text-sm font-sans">/ month</span>
              </div>
              <p className="text-chayo-muted text-base font-sans font-medium">Perfect for personal brands &amp; small businesses</p>
            </div>

            <ul className="flex flex-col gap-3">
              {[
                '2 branded videos per week',
                'Short-form optimized',
                'TikTok &amp; Reels ready',
                'AI-enhanced storytelling',
                'Fast weekly delivery',
                'Download &amp; publish instantly',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-base font-sans text-chayo-text font-medium">
                  <svg className="w-4 h-4 text-chayo-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span dangerouslySetInnerHTML={{ __html: feature }} />
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2">
              <StartMembershipButton />
            </div>
          </div>

          {/* Premium */}
          <div className="bg-chayo-bg p-8 sm:p-10 flex flex-col gap-6 border border-chayo-border">
            <div>
              <p className="text-chayo-muted text-xs tracking-[0.2em] uppercase font-sans mb-3">Brand Plan</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display text-4xl text-chayo-text">Custom</span>
              </div>
              <p className="text-chayo-muted text-base font-sans font-medium">For brands that need more volume and priority production</p>
            </div>

            <ul className="flex flex-col gap-3">
              {[
                'More videos per week',
                'Priority production queue',
                'Custom campaign strategy',
                'Dedicated production team',
                'Brand brief consultation',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-base font-sans text-chayo-muted font-medium">
                  <svg className="w-4 h-4 text-chayo-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2">
              <a
                href="https://wa.me/14125832544"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-8 py-4 border border-chayo-border text-chayo-text font-sans text-base tracking-wide rounded-sm hover:border-chayo-accent hover:text-chayo-accent active:scale-[0.98] transition-all duration-150 min-h-[52px] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contact via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
