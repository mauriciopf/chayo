import React from "react";
import { motion } from "framer-motion";

const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 1 } },
};

const buttonVariants = {
  hover: { scale: 1.08, boxShadow: "0 0 32px 8px #fb923c" },
  tap: { scale: 0.96 },
};

const sparkVariants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: (i) => ({
    opacity: 0.7,
    scale: 1,
    transition: { delay: 1.2 + i * 0.2, duration: 0.8, yoyo: Infinity }
  })
};

const sparks = [
  { top: "10%", left: "20%", color: "#E87811" },
  { top: "30%", left: "80%", color: "#FFB066" },
  { top: "70%", left: "15%", color: "#B85C0A" },
  { top: "60%", left: "70%", color: "#fff" },
  { top: "20%", left: "60%", color: "#FFB066" },
  { top: "50%", left: "50%", color: "#06b6d4" },
  { top: "80%", left: "80%", color: "#a78bfa" },
];

const Hero = () => (
  <section className="relative bg-black text-white py-20 sm:py-28 md:py-40 text-center overflow-hidden min-h-[60vh] flex items-center justify-center">
    {/* Animated floating blurred gradient background - now covers full width on mobile */}
    <motion.div
      className="absolute left-1/2 top-0 -translate-x-1/2 w-full sm:w-[90vw] md:w-[70vw] lg:w-[60vw] h-[32vh] sm:h-[40vh] bg-gradient-to-tr from-orange-400 via-cyan-400 to-violet-500 opacity-30 blur-3xl rounded-full z-0 animate-float-slow"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 0.3, scale: 1 }}
      transition={{ duration: 1.2 }}
    />
    {/* Animated floating sparks (hidden on xs for clarity) */}
    {sparks.map((spark, i) => (
      <motion.span
        key={i}
        className="absolute rounded-full blur-2xl hidden xs:block"
        style={{
          width: 32,
          height: 32,
          background: spark.color,
          top: spark.top,
          left: spark.left,
          opacity: 0.7,
          zIndex: 1,
        }}
        initial="initial"
        animate="animate"
        variants={sparkVariants}
        custom={i}
      />
    ))}
    {/* Floating mascot/icon, responsive size and lower opacity, behind text */}
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none select-none"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 0.18 }}
      transition={{ delay: 1.1, duration: 1.2, type: "spring" }}
    >
      <span className="text-[3.5rem] xs:text-[4.5rem] sm:text-[6rem] md:text-[8rem] drop-shadow-2xl animate-float-slow">
        🤖
      </span>
    </motion.div>
    <div className="relative z-20 w-full max-w-2xl mx-auto px-4 flex flex-col items-center justify-center">
      <motion.h1
        className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 sm:mb-8 bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight leading-tight"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        Empower Your Business<br className="hidden md:block" />
        with <span className="text-white/90">Agentic AI</span>
      </motion.h1>
      <motion.p
        className="text-base xs:text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 text-white/80 max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl mx-auto drop-shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <span className="bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent font-semibold">Custom AI solutions</span> to <span className="text-orange-400 font-semibold">automate</span>, <span className="text-cyan-400 font-semibold">optimize</span>, and <span className="text-violet-400 font-semibold">innovate</span> your workflow.
      </motion.p>
      <motion.a
        href="#contact"
        className="inline-block w-full xs:w-auto bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-full font-bold text-lg sm:text-xl shadow-xl hover:from-orange-500 hover:to-violet-700 hover:scale-105 focus:scale-95 transition-all drop-shadow-lg"
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
