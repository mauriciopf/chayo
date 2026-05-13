import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { Logo } from '@/components/Logo';

async function getSubscriptionStatus(userId: string) {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) return { active: false, subscription: null };

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    const sub = subscriptions.data[0] ?? null;
    return { active: !!sub, subscription: sub };
  } catch {
    return { active: false, subscription: null };
  }
}

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/dashboard/membership');

  const { active, subscription } = await getSubscriptionStatus(user.id);

  const nextBilling = subscription && 'current_period_end' in subscription && typeof subscription.current_period_end === 'number'
    ? new Date((subscription.current_period_end as number) * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-chayo-bg text-chayo-text">
      {/* Nav */}
      <nav className="border-b border-chayo-border px-5 sm:px-8 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <Logo href="/dashboard" size="sm" className="hover:text-chayo-accent transition-colors" />
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-chayo-muted hover:text-chayo-text transition-colors font-sans">
            Logout
          </button>
        </form>
      </nav>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-16">
        <div className="mb-12">
          <p className="text-chayo-muted text-xs tracking-[0.25em] uppercase font-sans mb-3">Membership</p>
          <h1 className="font-display text-display-md text-chayo-text">Your plan.</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-chayo-border">
          {/* Basic plan */}
          <div className="bg-chayo-surface p-8 flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-chayo-accent text-xs tracking-[0.2em] uppercase font-sans">Creator Plan</p>
                {active && (
                  <span className="px-2.5 py-1 bg-chayo-accent/10 text-chayo-accent text-xs font-sans rounded-sm">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-4xl text-chayo-text">$499</span>
                <span className="text-chayo-muted text-sm font-sans">/ month</span>
              </div>
              {nextBilling && (
                <p className="text-chayo-muted text-xs font-sans mt-1">
                  Next billing: {nextBilling}
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-3">
              {[
                '2 branded videos per week',
                'TikTok & Reels ready',
                'AI-enhanced storytelling',
                'Weekly delivery',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm font-sans text-chayo-text">
                  <svg className="w-4 h-4 text-chayo-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2">
              {active ? (
                <a
                  href="https://wa.me/14125832544"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-6 py-3.5 border border-chayo-border text-chayo-text font-sans text-sm tracking-wide rounded-sm hover:border-chayo-accent hover:text-chayo-accent transition-colors flex items-center justify-center gap-2"
                >
                  Manage via WhatsApp
                </a>
              ) : (
                <form action="/api/stripe/checkout" method="POST">
                  <button
                    type="submit"
                    className="w-full px-6 py-3.5 bg-chayo-accent text-chayo-bg font-sans font-semibold text-sm tracking-wide rounded-sm hover:bg-chayo-accent-hover transition-colors"
                  >
                    Subscribe Now — $499/mo
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Premium */}
          <div className="bg-chayo-bg p-8 flex flex-col gap-6 border border-chayo-border">
            <div>
              <p className="text-chayo-muted text-xs tracking-[0.2em] uppercase font-sans mb-3">Brand Plan</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display text-4xl text-chayo-text">Custom</span>
              </div>
              <p className="text-chayo-muted text-sm font-sans">More volume, priority production, custom campaigns</p>
            </div>

            <ul className="flex flex-col gap-3">
              {[
                'More videos per week',
                'Priority queue',
                'Campaign strategy',
                'Dedicated team',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm font-sans text-chayo-muted">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2">
              <a
                href="https://wa.me/14125832544"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-6 py-3.5 border border-chayo-border text-chayo-text font-sans text-sm tracking-wide rounded-sm hover:border-chayo-accent hover:text-chayo-accent transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contact via WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/dashboard" className="text-chayo-muted text-sm font-sans hover:text-chayo-text transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
