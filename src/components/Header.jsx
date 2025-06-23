import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Header = ({ darkMode, setDarkMode }) => {
  const [menuOpen, setMenuOpen] = useState(false);

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#industry-process", label: "How It Works" },
  { href: "#faq", label: "FAQ" },
  { href: "/startaicall", label: "Start AI Call", isButton: true },
  { href: "#contact", label: "Let's Talk" }]

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-2 xs:px-4 md:px-8 py-2 xs:py-3 md:py-4 flex justify-between items-center border-b border-gray-800 bg-black/80 backdrop-blur-xl shadow-2xl">
      {/* Layered animated gradients and glassy overlays for header - hide on mobile */}
      <motion.div
        className="absolute left-1/2 top-0 -translate-x-1/2 w-[90vw] sm:w-[60vw] h-12 sm:h-20 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-600 opacity-30 blur-2xl rounded-full z-0 pointer-events-none hidden xs:block"
        animate={{ opacity: [0.18, 0.32, 0.18], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] sm:w-[40vw] h-6 sm:h-10 bg-gradient-to-r from-white/40 via-cyan-400/20 to-orange-400/20 opacity-20 blur-lg rounded-full z-0 pointer-events-none hidden xs:block"
        animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      {/* Subtle floating accent dots - hide on mobile */}
      {[...Array(4)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full blur-2xl hidden sm:block"
          style={{
            width: 12 + i * 4,
            height: 12 + i * 4,
            background: i % 2 === 0 ? '#E87811' : '#06b6d4',
            top: `${30 + i * 8}%`,
            left: `${10 + i * 20}%`,
            opacity: 0.3 + (i % 2) * 0.1,
            zIndex: 1,
          }}
          animate={{ y: [0, -6, 6, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity, repeatType: 'mirror', delay: i * 0.2 }}
        />
      ))}
      <div className="relative z-10 flex items-center gap-2">
        {/* Professional Logo Design */}
        <motion.div 
          className="flex items-center gap-3 group cursor-pointer"
          whileHover={{ scale: 1.02 }}
          onClick={() => window.location.href = '/'}
        >
          {/* Professional Logo Icon */}
          <motion.div 
            className="relative w-10 h-10 sm:w-12 sm:h-12"
            animate={{ rotate: [0, 1, -1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-cyan-400 rounded-xl opacity-90 shadow-lg" />
            <div className="absolute inset-1 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg sm:text-xl">A</span>
            </div>
          </motion.div>
          
          {/* Enhanced Agentic AI text */}
          <div className="flex flex-col">
            <span
              className="font-black text-lg xs:text-xl md:text-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-600 bg-clip-text text-transparent tracking-wide group-hover:scale-105 transition-transform select-none"
              style={{ letterSpacing: '0.1em' }}
            >
              Agentic AI
            </span>
            <span className="text-xs text-white/60 font-light tracking-wider hidden sm:block">
              Neural Intelligence
            </span>
          </div>
        </motion.div>
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
        {navLinks.map((link, idx) => (
          link.isButton ? (
            <motion.a
              key={link.href}
              href={link.href}
              className="relative px-6 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-medium text-sm tracking-wide hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
              whileHover={{ 
                scale: 1.02,
                y: -1
              }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">{link.label}</span>
              
              {/* Subtle hover glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
              />
              
              {/* Minimal active indicator */}
              <motion.div
                className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white/60 group-hover:w-1/2 transition-all duration-300 -translate-x-1/2 rounded-full"
              />
            </motion.a>
          ) : (
            <motion.a
              key={link.href}
              href={link.href}
              className="relative px-2 py-1 text-white group"
              whileHover={{ scale: 1.13, y: -2, color: '#06b6d4', textShadow: '0 2px 16px #06b6d4' }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
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
          )
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
              link.isButton ? (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="relative px-8 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-medium text-base tracking-wide hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="relative z-10">{link.label}</span>
                  
                  {/* Subtle hover glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
                  />
                  
                  {/* Minimal active indicator */}
                  <motion.div
                    className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-white/60 group-hover:w-1/3 transition-all duration-300 -translate-x-1/2 rounded-full"
                  />
                </motion.a>
              ) : (
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
              )
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
