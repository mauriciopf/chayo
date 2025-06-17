import React from "react";
import { motion } from "framer-motion";

const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 1 } },
};

const buttonVariants = {
  hover: { scale: 1.08, boxShadow: "0 0 16px #E87811" },
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
];

const Hero = () => (
  <section className="relative bg-black text-white py-24 text-center overflow-hidden">
    {/* Animated floating sparks */}
    {sparks.map((spark, i) => (
      <motion.span
        key={i}
        className="absolute rounded-full blur-xl"
        style={{
          width: 40,
          height: 40,
          background: spark.color,
          top: spark.top,
          left: spark.left,
          opacity: 0.7,
          zIndex: 0,
        }}
        initial="initial"
        animate="animate"
        variants={sparkVariants}
        custom={i}
      />
    ))}
    <div className="relative z-10 container mx-auto px-4">
      <motion.h1
        className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-orange-400 via-orange-500 to-white bg-clip-text text-transparent"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        Empower Your Business with <span className="text-orange-400">Agentic AI</span>
      </motion.h1>
      <motion.p
        className="text-base sm:text-lg md:text-xl mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        Custom AI solutions to <span className="text-orange-400 font-semibold">automate</span>, <span className="text-orange-500 font-semibold">optimize</span>, and <span className="text-white font-semibold">innovate</span> your workflow.
      </motion.p>
      <motion.a
        href="#contact"
        className="inline-block bg-orange-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-lg font-semibold text-base md:text-lg shadow hover:bg-orange-700 transition"
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
