import React from "react";
import { Link } from "react-router-dom";

export default function Footer({ darkMode }) {
  return (
    <footer className="relative w-full py-8 sm:py-12 md:py-16 flex flex-col items-center bg-transparent text-center text-xs sm:text-sm md:text-base mt-8 sm:mt-12 md:mt-16 lg:mt-24 transition-colors duration-300 text-gray-700">
      {/* Dramatic animated gradient - mobile optimized */}
      <div className="absolute -top-6 sm:-top-12 md:-top-16 left-1/2 -translate-x-1/2 w-[90vw] sm:w-[60vw] md:w-[40vw] h-6 sm:h-12 md:h-20 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-300 opacity-30 blur-2xl rounded-full z-0 animate-pulse" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] sm:w-[40vw] md:w-[30vw] h-3 sm:h-6 md:h-8 bg-gradient-to-r from-white/40 via-cyan-400/20 to-orange-400/20 opacity-20 blur-lg rounded-full z-0 pointer-events-none" aria-hidden="true" />
      
      {/* Floating accent dots - fewer on mobile */}
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className={`absolute rounded-full blur-2xl ${i > 0 ? 'hidden sm:block' : ''}`}
          style={{
            width: 8 + i * 3,
            height: 8 + i * 3,
            background: i % 2 === 0 ? '#E87811' : '#06b6d4',
            top: `${60 + i * 8}%`,
            left: `${30 + i * 20}%`,
            opacity: 0.3 + (i % 2) * 0.1,
            zIndex: 1,
          }}
        />
      ))}
      
      <div className="relative z-10 px-4 sm:px-6">
        <p className="font-medium tracking-wide mb-2 text-sm sm:text-base">
          <span className="text-gray-700">© 2024</span>{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent font-semibold">Agentic AI</span>
          <span className="text-gray-700">. All rights reserved.</span>
        </p>
        <p className="text-xs sm:text-sm mb-3 font-medium tracking-wide text-gray-600">
          Formerly as WappDevelopers S.A. de C.V.
        </p>
        
        {/* Mobile-first contact layout */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-2">
          <p className="text-center">
            Contact us: {" "}
            <a
              href="mailto:mauricio.perezflores@gmail.com"
              className="underline hover:text-emerald-600 transition-colors font-semibold break-all sm:break-normal"
            >
              mauricio.perezflores@gmail.com
            </a>
          </p>
          <span className="hidden sm:inline text-gray-600">•</span>
          <Link
            to="/privacy"
            className="underline hover:text-emerald-600 transition-colors font-semibold hover:bg-gradient-to-r hover:from-emerald-600 hover:to-emerald-800 hover:bg-clip-text hover:text-transparent"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
