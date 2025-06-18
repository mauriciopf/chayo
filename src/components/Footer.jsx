import React from "react";

export default function Footer() {
  return (
    <footer className="relative w-full py-8 xs:py-12 sm:py-16 flex flex-col items-center bg-transparent text-gray-700 dark:text-gray-200 text-center text-xs xs:text-sm md:text-lg mt-12 xs:mt-16 md:mt-24">
      {/* Dramatic animated gradient and glassy overlays for footer */}
      <div className="absolute -top-8 xs:-top-16 left-1/2 -translate-x-1/2 w-[90vw] sm:w-[40vw] h-8 sm:h-20 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-300 opacity-30 blur-2xl rounded-full z-0 animate-pulse" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] sm:w-[30vw] h-4 sm:h-8 bg-gradient-to-r from-white/40 via-cyan-400/20 to-orange-400/20 opacity-20 blur-lg rounded-full z-0 pointer-events-none" aria-hidden="true" />
      {/* Floating accent dots */}
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className={`absolute rounded-full blur-2xl ${i > 1 ? 'hidden xs:block' : ''}`}
          style={{
            width: 10 + i * 4,
            height: 10 + i * 4,
            background: i % 2 === 0 ? '#E87811' : '#06b6d4',
            top: `${60 + i * 8}%`,
            left: `${30 + i * 20}%`,
            opacity: 0.3 + (i % 2) * 0.1,
            zIndex: 1,
          }}
        />
      ))}
      <div className="relative z-10">
        <p className="font-black tracking-widest uppercase bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-600 bg-clip-text text-transparent drop-shadow-xl mb-2 text-xs xs:text-sm md:text-lg">
          © Agentic AI. All rights reserved.
        </p>
        <p>
          Contact us: {" "}
          <a
            href="mailto:mauricio.perezflores@gmail.com"
            className="underline hover:text-orange-400 transition-colors font-semibold"
          >
            mauricio.perezflores@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}
