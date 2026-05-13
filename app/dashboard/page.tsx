import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/Logo';

const steps = [
  {
    n: '01',
    title: 'Brand brief sent',
    desc: 'You\'ll receive a brand brief template in your inbox to complete your profile.',
  },
  {
    n: '02',
    title: 'First production call within 24h',
    desc: 'Our team reviews your brief and reaches out to align on your first videos.',
  },
  {
    n: '03',
    title: 'Your first weekly videos within 7 days',
    desc: 'Sit back — your branded content will be ready to download and publish.',
  },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const params = await searchParams;
  const justSubscribed = params.checkout === 'success';

  return (
    <div className="min-h-screen bg-chayo-bg text-chayo-text">
      {/* Nav */}
      <nav className="border-b border-chayo-border px-5 sm:px-8 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <Logo href="/" size="sm" className="hover:text-chayo-accent transition-colors" />
        <div className="flex items-center gap-6">
          <Link href="/dashboard/membership" className="text-sm text-chayo-muted hover:text-chayo-text transition-colors font-sans">
            Membership
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm text-chayo-muted hover:text-chayo-text transition-colors font-sans">
              Logout
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-16">
        {justSubscribed && (
          <div className="mb-10 p-6 border border-chayo-accent/30 bg-chayo-accent/5 rounded-sm">
            <p className="text-chayo-accent font-sans text-sm font-medium">
              🎉 Welcome to Chayo! Your membership is active. Here&#39;s what happens next.
            </p>
          </div>
        )}

        <div className="mb-12">
          <p className="text-chayo-muted text-xs tracking-[0.25em] uppercase font-sans mb-3">Dashboard</p>
          <h1 className="font-display text-display-md text-chayo-text">
            Welcome{user.email ? `, ${user.email.split('@')[0]}` : ''}.
          </h1>
        </div>

        {/* Next steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-chayo-border mb-12">
          {steps.map((s) => (
            <div key={s.n} className="bg-chayo-surface p-6 sm:p-8 flex flex-col gap-3">
              <span className="font-display text-4xl text-chayo-border select-none">{s.n}</span>
              <h3 className="font-display text-lg text-chayo-text">{s.title}</h3>
              <p className="text-chayo-muted text-sm leading-relaxed font-sans">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard/membership"
            className="px-6 py-3.5 bg-chayo-accent text-chayo-bg font-sans font-semibold text-sm tracking-wide rounded-sm hover:bg-chayo-accent-hover transition-colors text-center"
          >
            View Membership
          </Link>
          <a
            href="https://wa.me/14125832544"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 border border-chayo-border text-chayo-text font-sans text-sm tracking-wide rounded-sm hover:border-chayo-accent hover:text-chayo-accent transition-colors text-center"
          >
            Contact Us on WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
