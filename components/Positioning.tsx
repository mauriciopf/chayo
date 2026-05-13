const pillars = [
  { label: 'Attention', desc: 'Videos engineered to stop the scroll and hold it.' },
  { label: 'Visual Identity', desc: 'Every frame reflects your brand — not a generic template.' },
  { label: 'Consistency', desc: 'Weekly production means your audience always has something new.' },
  { label: 'Internet Relevance', desc: 'Short-form native content that actually performs on modern platforms.' },
];

export function Positioning() {
  return (
    <section className="section-pad bg-chayo-bg">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left: headline block */}
          <div className="lg:sticky lg:top-32">
            <p className="text-chayo-accent text-xs tracking-[0.25em] uppercase mb-6 font-sans">
              Why Chayo
            </p>
            <h2 className="font-display text-display-lg text-chayo-text text-balance mb-6">
              Not another marketing agency.
            </h2>
            <p className="font-display text-display-md text-chayo-muted italic text-balance">
              A content production machine for modern brands.
            </p>

            <div className="mt-10 w-16 h-px bg-chayo-accent" />
          </div>

          {/* Right: pillars list */}
          <div className="flex flex-col divide-y divide-chayo-border">
            {pillars.map((p) => (
              <div key={p.label} className="py-8 flex flex-col gap-2">
                <h3 className="font-display text-xl text-chayo-text">{p.label}</h3>
                <p className="text-chayo-muted text-sm leading-relaxed font-sans">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
