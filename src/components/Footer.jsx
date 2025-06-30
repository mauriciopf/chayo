import React from "react";
import { Link } from "react-router-dom";

export default function Footer({ darkMode }) {
  return (
    <footer className={`relative w-full py-8 xs:py-12 sm:py-16 flex flex-col items-center bg-transparent text-center text-xs xs:text-sm md:text-lg mt-12 xs:mt-16 md:mt-24 transition-colors duration-300 ${
      darkMode ? 'text-gray-200' : 'text-gray-700'
    }`}>
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
        <p className="font-medium tracking-wide mb-2 text-sm md:text-base">
          <span className={`${darkMode ? 'text-white/80' : 'text-gray-700'}`}>© 2024</span>{' '}
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent font-semibold">Agentic AI</span>
          <span className={`${darkMode ? 'text-white/80' : 'text-gray-700'}`}>. All rights reserved.</span>
        </p>
        <p className={`text-xs xs:text-sm mb-3 font-medium tracking-wide ${
          darkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Formerly as WappDevelopers S.A. de C.V.
        </p>
        <div className="flex flex-col xs:flex-row items-center justify-center gap-2 xs:gap-4 mb-2">
          <p>
            Contact us: {" "}
            <a
              href="mailto:mauricio.perezflores@gmail.com"
              className={`underline hover:text-orange-400 transition-colors font-semibold`}
            >
              mauricio.perezflores@gmail.com
            </a>
          </p>
          <span className={`hidden xs:inline ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>•</span>
          <Link
            to="/privacy"
            className="underline hover:text-cyan-400 transition-colors font-semibold hover:bg-gradient-to-r hover:from-orange-400 hover:to-cyan-400 hover:bg-clip-text hover:text-transparent"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
