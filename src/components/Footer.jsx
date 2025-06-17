import React from "react";

export default function Footer({ darkMode }) {
  return (
    <footer className="bg-black text-white border-t border-gray-800 py-8 text-center text-sm transition-colors duration-500">
      <p>
        © Agentic AI. All rights reserved. Contact us:{" "}
        <a href="mailto:mauricio.perezflores@gmail.com" className="underline">
          mauricio.perezflores@gmail.com
        </a>
      </p>
    </footer>
  );
}
