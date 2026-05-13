const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    body: 'Simple onboarding. No long forms, no onboarding calls required to get started.',
  },
  {
    number: '02',
    title: 'Upload Your Brand',
    body: 'Share your logos, products, references, Instagram or TikTok links, brand voice, and competitors you admire.',
  },
  {
    number: '03',
    title: 'We Produce Your Videos',
    body: 'Your team receives weekly short-form videos — TikTok and Reels ready, AI-enhanced storytelling, fast delivery.',
  },
  {
    number: '04',
    title: 'Approve & Post',
    body: 'Download and publish instantly. No editing required on your end.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-pad bg-chayo-bg">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Heading */}
        <div className="max-w-xl mb-16 sm:mb-20">
          <p className="text-chayo-accent text-xs tracking-[0.25em] uppercase mb-4 font-sans">
            Process
          </p>
          <h2 className="font-display text-display-lg text-chayo-text text-balance">
            Four steps. Weekly results.
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-chayo-border">
          {steps.map((step) => (
            <div key={step.number} className="bg-chayo-bg p-8 sm:p-10 flex flex-col gap-5">
              <span className="font-display text-5xl text-chayo-border select-none">{step.number}</span>
              <div>
                <h3 className="font-display text-xl text-chayo-text mb-3">{step.title}</h3>
                <p className="text-chayo-muted text-sm leading-relaxed font-sans">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
