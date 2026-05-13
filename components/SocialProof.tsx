import { InstagramGrid } from './InstagramGrid';

export function SocialProof() {
  return (
    <section id="examples" className="section-pad bg-chayo-surface">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Heading */}
        <div className="max-w-xl mb-12 sm:mb-16">
          <p className="text-chayo-accent text-xs tracking-[0.25em] uppercase mb-4 font-sans">
            Work We&apos;ve Produced
          </p>
          <h2 className="font-display text-display-lg text-chayo-text text-balance">
            Real videos.
            <br />
            Real brands.
          </h2>
        </div>

        {/* KPI chips */}
        <div className="flex flex-wrap gap-3 mb-12">
          {['Weekly Delivery', 'TikTok & Reels Ready', 'Brand-First AI', 'Fast Turnaround'].map((chip) => (
            <span
              key={chip}
              className="px-4 py-2 border border-chayo-border text-chayo-muted text-sm tracking-[0.12em] uppercase font-sans font-medium rounded-sm"
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Instagram grid — 12 posts */}
        <InstagramGrid limit={12} />

        {/* Testimonial placeholder */}
        <div className="mt-16 border border-chayo-border p-8 sm:p-12 max-w-2xl">
          <p className="font-display text-xl text-chayo-text italic mb-6 leading-relaxed text-balance">
            &ldquo;The quality and consistency of content Chayo delivers every week has completely
            transformed how our brand shows up online.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chayo-border" />
            <div>
              <p className="text-chayo-text text-sm font-sans font-medium">Brand Partner</p>
              <p className="text-chayo-muted text-sm font-sans font-medium">Founder, [Brand Name]</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
