import React from "react";

export default function Footer() {
  return (
    <footer className="relative w-full py-12 flex flex-col items-center bg-transparent text-gray-700 dark:text-gray-200 text-center text-sm mt-16">
      {/* Floating blurred accent shape */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-16 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-300 opacity-20 blur-2xl rounded-full z-0 animate-pulse" aria-hidden="true" />
      <div className="relative z-10">
        <p>
          © Agentic AI. All rights reserved. Contact us:{" "}
          <a
            href="mailto:mauricio.perezflores@gmail.com"
            className="underline hover:text-orange-400 transition-colors"
          >
            mauricio.perezflores@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}
