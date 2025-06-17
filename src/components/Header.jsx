import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#solutions", label: "Solutions" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Let’s Talk" },
];

const Header = ({ darkMode, setDarkMode }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-2 md:px-8 py-2 md:py-4 flex justify-between items-center border-b border-gray-800 bg-black/60 backdrop-blur-xl shadow-lg">
      {/* Animated orange glow behind logo */}
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 w-20 h-10 bg-orange-500 opacity-20 blur-2xl rounded-full z-0 pointer-events-none hidden sm:block"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <div className="relative z-10 flex items-center gap-2">
        {/* Creative SVG logo */}
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 md:h-10 w-8 md:w-10 drop-shadow-lg">
          <defs>
            <radialGradient id="agentic-glow" cx="50%" cy="50%" r="60%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#FFB066" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#E87811" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E87811" stopOpacity="0.2" />
            </radialGradient>
            <linearGradient id="agentic-main" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB066" />
              <stop offset="1" stopColor="#E87811" />
            </linearGradient>
          </defs>
          <circle cx="19" cy="19" r="18" fill="url(#agentic-glow)" />
          <path d="M11 27L19 7L27 27" stroke="url(#agentic-main)" strokeWidth="3.5" strokeLinecap="round"/>
          <circle cx="19" cy="23" r="2.5" fill="#fff" stroke="#E87811" strokeWidth="1.5" />
        </svg>
        <span className="font-extrabold text-lg md:text-xl bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent tracking-tight hidden sm:inline-block">Agentic <span className="font-black">AI</span></span>
      </div>
      {/* Hamburger for mobile */}
      <button
        className="md:hidden z-20 p-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 relative"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle navigation menu"
      >
        <motion.span
          className="block w-6 h-0.5 bg-white mb-1 rounded absolute left-0 top-2 transition-all"
          animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
        />
        <motion.span
          className={`block w-6 h-0.5 bg-white mb-1 rounded absolute left-0 top-4 transition-all ${menuOpen ? 'opacity-0' : ''}`}
          animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
        />
        <motion.span
          className="block w-6 h-0.5 bg-white rounded absolute left-0 top-6 transition-all"
          animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
        />
      </button>
      {/* Desktop nav */}
      <nav className="hidden md:flex gap-6 text-sm font-medium items-center relative z-10">
        {navLinks.map((link) => (
          <motion.a
            key={link.href}
            href={link.href}
            className="relative px-2 py-1 text-white group"
            whileHover="hover"
            initial="rest"
            animate="rest"
            variants={{}}
          >
            <span>{link.label}</span>
            <motion.span
              className="absolute left-0 -bottom-1 w-full h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full"
              layoutId="nav-underline"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          </motion.a>
        ))}
        <motion.button
          onClick={() => setDarkMode(!darkMode)}
          className="ml-4 text-xs px-3 py-2 border border-orange-500 rounded bg-black/60 backdrop-blur hover:bg-orange-500 hover:text-white transition relative overflow-hidden shadow-orange-500/30 shadow-md"
          whileHover={{ scale: 1.08, boxShadow: "0 0 16px #E87811" }}
          whileTap={{ scale: 0.96 }}
          aria-label="Toggle Dark Mode"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
            aria-hidden="true"
          />
          {darkMode ? "Light Mode" : "Dark Mode"}
        </motion.button>
      </nav>
      {/* Mobile nav overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 w-full bg-black/95 backdrop-blur-lg shadow-lg flex flex-col items-center py-8 gap-6 text-lg font-semibold z-40"
          >
            {navLinks.map((link) => (
              <motion.a
                key={link.href}
                href={link.href}
                className="relative px-2 py-1 text-white group"
                whileHover="hover"
                initial="rest"
                animate="rest"
                variants={{}}
                onClick={() => setMenuOpen(false)}
              >
                <span>{link.label}</span>
                <motion.span
                  className="absolute left-0 -bottom-1 w-full h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full"
                  layoutId="nav-underline-mobile"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </motion.a>
            ))}
            <motion.button
              onClick={() => { setDarkMode(!darkMode); setMenuOpen(false); }}
              className="text-xs px-3 py-2 border border-orange-500 rounded bg-black/60 backdrop-blur hover:bg-orange-500 hover:text-white transition relative overflow-hidden shadow-orange-500/30 shadow-md"
              whileHover={{ scale: 1.08, boxShadow: "0 0 16px #E87811" }}
              whileTap={{ scale: 0.96 }}
              aria-label="Toggle Dark Mode"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
                aria-hidden="true"
              />
              {darkMode ? "Light Mode" : "Dark Mode"}
            </motion.button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
