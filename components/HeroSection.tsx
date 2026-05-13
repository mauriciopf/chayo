'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Only attempt autoplay if user hasn't requested reduced motion
    if (
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      videoRef.current
    ) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — poster frame stays visible, no error surfaced
      });
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-chayo-bg">
      {/* Background video — CSS gradient fallback is the bg-chayo-bg color */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero-reel-poster.jpg"
          aria-hidden="true"
        >
          {/* Primary source: high-quality MP4 for broad browser support */}
          <source src="/hero-reel.mp4" type="video/mp4" />
          {/* Fallback source */}
          <source src="/hero-reel.MOV" type="video/quicktime" />
        </video>
        {/* Dark gradient scrim over video */}
        <div className="absolute inset-0 bg-gradient-to-b from-chayo-bg/60 via-chayo-bg/30 to-chayo-bg/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 text-center pt-24 pb-16">
        <p className="animate-fade-in text-chayo-accent text-xs sm:text-sm tracking-[0.25em] uppercase mb-6 font-sans">
          AI Video Production for Brands
        </p>

        <h1 className="animate-fade-up font-display text-display-xl text-chayo-text text-balance leading-tight mb-6">
          Your brand deserves content
          <br className="hidden sm:block" />
          <em className="not-italic text-chayo-accent"> people remember.</em>
        </h1>

        <p className="animate-fade-up delay-200 text-chayo-muted text-lg sm:text-xl max-w-2xl mx-auto text-balance leading-relaxed mb-10 font-sans">
          Upload your brand, references, products, and ideas.
          <br className="hidden sm:block" />
          We create weekly AI-powered branded videos for your business.
        </p>

        <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#pricing"
            className="w-full sm:w-auto px-8 py-4 bg-chayo-accent text-chayo-bg font-sans font-semibold text-sm tracking-wide rounded-sm hover:bg-chayo-accent-hover active:scale-[0.98] transition-all duration-150 min-h-[52px] flex items-center justify-center"
          >
            Start Membership
          </Link>
          <a
            href="#examples"
            className="w-full sm:w-auto px-8 py-4 border border-chayo-border text-chayo-text font-sans text-sm tracking-wide rounded-sm hover:border-chayo-accent hover:text-chayo-accent active:scale-[0.98] transition-all duration-150 min-h-[52px] flex items-center justify-center"
          >
            See Examples
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-500">
        <span className="text-chayo-muted text-xs tracking-[0.2em] uppercase font-sans">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-chayo-muted to-transparent" />
      </div>
    </section>
  );
}
