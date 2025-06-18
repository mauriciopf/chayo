import React from "react";
import { motion } from "framer-motion";

const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 1 } },
};

const buttonVariants = {
  hover: { scale: 1.12, boxShadow: "0 0 64px 16px #fb923c, 0 0 128px 32px #06b6d4" },
  tap: { scale: 0.96 },
};

const Hero = () => (
  <section className="relative bg-black text-white py-16 xs:py-20 sm:py-32 md:py-56 text-center overflow-hidden min-h-[70vh] flex items-center justify-center">
    {/* Multi-layered animated 3D gradients and glassy overlays - mobile optimized */}
    <motion.div
      className="absolute left-1/2 top-0 -translate-x-1/2 w-[120vw] sm:w-[100vw] h-[40vh] sm:h-[60vh] bg-gradient-to-tr from-orange-400 via-cyan-400 to-violet-500 opacity-40 blur-3xl rounded-full z-0 animate-float-slow"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 0.4, scale: 1.1 }}
      transition={{ duration: 1.2 }}
    />
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[70vw] h-[24vh] sm:h-[40vh] bg-gradient-to-br from-cyan-400/60 via-white/10 to-orange-400/60 opacity-30 blur-2xl rounded-full z-0 animate-float"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.3, scale: 1 }}
      transition={{ duration: 1.6, delay: 0.2 }}
    />
    {/* Parallax floating sparkles and light streaks - hide some on mobile */}
    {[...Array(8)].map((_, i) => (
      <motion.span
        key={i}
        className={`absolute rounded-full blur-2xl pointer-events-none ${i > 3 ? 'hidden xs:block' : ''}`}
        style={{
          width: 24 + i * 4,
          height: 24 + i * 4,
          background: i % 2 === 0 ? '#E87811' : i % 3 === 0 ? '#06b6d4' : '#fff',
          top: `${10 + i * 9}%`,
          left: `${15 + i * 10}%`,
          opacity: 0.4 + (i % 3) * 0.1,
          zIndex: 1,
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 0.7, scale: 1, y: [0, -12, 12, 0] }}
        transition={{ duration: 4 + i, repeat: Infinity, repeatType: 'mirror', delay: i * 0.2 }}
      />
    ))}
    {/* Floating glassy light streak - smaller on mobile */}
    <motion.div
      className="absolute left-1/2 top-1/3 -translate-x-1/2 w-2/3 sm:w-1/2 h-8 sm:h-12 bg-gradient-to-r from-white/60 via-cyan-400/40 to-orange-400/40 opacity-30 blur-2xl rounded-full z-10 animate-float"
      aria-hidden="true"
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 0.3, scaleX: 1 }}
      transition={{ duration: 2.2, delay: 0.6 }}
    />
    {/* Floating mascot/icon, behind text - responsive size */}
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none select-none"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 0.13 }}
      transition={{ delay: 1.1, duration: 1.2, type: "spring" }}
    >
      <span className="text-[3rem] xs:text-[4.5rem] sm:text-[7rem] md:text-[10rem] drop-shadow-2xl animate-float-slow">
        🤖
      </span>
    </motion.div>
    <div className="relative z-20 w-full max-w-xl xs:max-w-2xl mx-auto px-2 xs:px-4 flex flex-col items-center justify-center">
      <motion.h1
        className="text-3xl xs:text-4xl sm:text-6xl md:text-8xl font-black mb-6 sm:mb-12 bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent drop-shadow-[0_4px_64px_rgba(6,182,212,0.25)] tracking-tight leading-tight uppercase"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        <span className="block text-white/90 tracking-widest">Lead the Era of</span>
        <span className="block bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent">Intelligence</span>
      </motion.h1>
      <motion.p
        className="text-base xs:text-lg sm:text-2xl md:text-3xl mb-8 sm:mb-14 text-white/80 max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl mx-auto drop-shadow-lg font-light tracking-wide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <span className="bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent font-semibold">AI for visionaries</span> — automate, optimize, and innovate with <span className="text-orange-400 font-semibold">Agentic AI</span>.
      </motion.p>
      <motion.a
        href="#contact"
        className="inline-block w-full xs:w-auto bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 text-white px-6 py-3 xs:px-10 xs:py-4 sm:px-14 sm:py-5 rounded-full font-black text-lg xs:text-2xl sm:text-3xl shadow-2xl hover:from-orange-500 hover:to-violet-700 hover:scale-110 focus:scale-95 transition-all drop-shadow-xl border-4 border-white/10 backdrop-blur-lg tracking-widest uppercase"
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.7 }}
      >
        Get Started
      </motion.a>
    </div>
  </section>
);

export default Hero;
