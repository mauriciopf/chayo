import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import Header from "./components/Header";
import Contact from "./components/Contact";
import { motion } from "framer-motion";
import AnimatedCounter from "./components/AnimatedCounter";
import DemoModal from "./components/DemoModal";
import FAQAccordion from "./components/FAQAccordion";
import ScrollToTopButton from "./components/ScrollToTopButton";
import IndustryProcess from "./components/IndustryProcess";

export default function AgenticAIHome() {
  const [darkMode, setDarkMode] = useState(true);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-black text-white transition-colors duration-700">
      <Helmet>
        <title>Agentic AI – Lead the Era of Intelligence</title>
        <meta
          name="description"
          content="Agentic AI helps you lead the era of intelligence with cutting-edge artificial intelligence services, automation, and business solutions."
        />
        <meta name="keywords" content="Agentic AI, Artificial Intelligence, AI Solutions, Automation, Business Intelligence, Machine Learning" />
        <meta name="author" content="Agentic AI" />
        <meta property="og:title" content="Agentic AI – Lead the Era of Intelligence" />
        <meta property="og:description" content="AI-powered innovation for modern businesses. Automate, scale, and thrive with Agentic AI." />
        <meta property="og:image" content="/agentic-logo.svg" />
        <meta property="og:url" content="https://agentic.ai" />
        <meta name="twitter:card" content="summary_large_image" />
        <html lang="en" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Agentic AI",
            "url": "https://agentic.ai",
            "logo": "https://agentic.ai/agentic-logo.svg",
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "mauricio.perezflores@gmail.com",
              "contactType": "Customer Support",
              "areaServed": "Worldwide",
              "availableLanguage": ["English", "Spanish"]
            },
            "sameAs": [
              "https://www.instagram.com/agenticai"
            ]
          }
        `}</script>
      </Helmet>

      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      {/* Floating Try Demo Button */}
      <button
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-orange-400 to-orange-600 text-white px-6 py-3 rounded-full shadow-xl font-bold text-lg hover:from-orange-500 hover:to-orange-700 transition-all animate-bounce focus:outline-none focus:ring-4 focus:ring-orange-400/50"
        onClick={() => setDemoOpen(true)}
        aria-label="Try Agentic AI Demo"
      >
        🤖 Try AI Demo
      </button>
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
      <ScrollToTopButton />

      <main className="pt-20 max-w-7xl mx-auto px-2 md:px-8 space-y-24 bg-black text-white">
        {/* Apple-inspired ultra-clean, spacious layout */}
        {/* Animated CTA Section */}
        <motion.section
          className="relative py-20 md:py-32 text-center overflow-visible"
          style={{ background: 'none' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          whileHover={{ scale: 1.01, boxShadow: '0 8px 64px 0 rgba(6,182,212,0.10)' }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        >
          {/* Floating blurred accent shape (subtle, Apple-style) */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[90vw] h-40 bg-gradient-to-r from-cyan-400 via-white/10 to-orange-400 opacity-10 blur-3xl rounded-full z-0 animate-float-slow" />
          <motion.h2 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-wide leading-tight text-white drop-shadow-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            whileHover={{ letterSpacing: '0.2em', color: '#06b6d4', textShadow: '0 2px 32px #06b6d4' }}
          >
            <span className="block text-[2.5rem] md:text-[4rem] font-black tracking-widest uppercase">Lead the Era of AI</span>
            <span className="block text-cyan-400 font-bold text-2xl md:text-4xl mt-2 tracking-tight">with Agentic AI</span>
          </motion.h2>
          <motion.p className="text-lg md:text-2xl mb-12 text-white/70 max-w-2xl mx-auto font-light tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.04, color: '#06b6d4' }}
          >
            Experience the next level of automation, intelligence, and business growth—powered by elegant, human-centered AI.
          </motion.p>
          <motion.a
            href="#contact"
            className="inline-block bg-cyan-400 text-black px-12 py-5 rounded-full font-bold text-xl shadow-xl hover:bg-cyan-300 focus:bg-cyan-500 transition-all duration-200 drop-shadow-lg tracking-wide uppercase"
            whileHover={{ scale: 1.12, backgroundColor: '#06b6d4', color: '#fff', boxShadow: '0 4px 32px 0 #06b6d4' }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started
          </motion.a>
        </motion.section>

        <div className="section-divider" />
        {/* Value Proposition Section */}
        <motion.section
          className="relative grid md:grid-cols-2 gap-32 items-center overflow-visible py-36 md:py-52"
          style={{ background: 'none' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          whileHover={{ scale: 1.01, boxShadow: '0 8px 64px 0 rgba(6,182,212,0.10)' }}
        >
          {/* Animated blurred accent shapes and parallax divider */}
          <motion.div
            className="absolute -top-40 left-1/3 w-[28rem] h-[28rem] bg-gradient-to-br from-cyan-400 to-white/10 opacity-10 blur-3xl rounded-full z-0 animate-float-slow"
            style={{ filter: 'blur(80px)' }}
            initial={{ y: -30 }}
            whileInView={{ y: 0 }}
            transition={{ duration: 1.2, type: 'spring' }}
          />
          <motion.div
            className="absolute -bottom-56 right-1/3 w-[36rem] h-[36rem] bg-gradient-to-br from-orange-300 to-cyan-400 opacity-10 blur-3xl rounded-full z-0 animate-float-slower"
            style={{ filter: 'blur(100px)' }}
            initial={{ y: 30 }}
            whileInView={{ y: 0 }}
            transition={{ duration: 1.2, type: 'spring' }}
          />
          {/* Animated vertical line accent */}
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-cyan-400/60 via-white/0 to-orange-400/60 opacity-60 rounded-full pointer-events-none"
            initial={{ scaleY: 0.7, opacity: 0 }}
            whileInView={{ scaleY: 1, opacity: 1 }}
            animate={{ scaleX: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ zIndex: 1 }}
          />
          <motion.div className="relative p-0 z-10 flex flex-col items-center text-center md:text-left"
            whileHover={{ scale: 1.06, rotate: -2 }}
          >
            <h3 className="text-3xl md:text-4xl font-black mb-12 text-cyan-400 uppercase tracking-[.25em] letter-spacing-wide drop-shadow-xl">In-House</h3>
            <ul className="space-y-8 text-2xl text-white/70 font-light">
              <li className="flex items-center gap-4"><span className="text-3xl">✖️</span> Higher costs</li>
              <li className="flex items-center gap-4"><span className="text-3xl">✖️</span> Slower response times</li>
              <li className="flex items-center gap-4"><span className="text-3xl">✖️</span> Limited scalability</li>
            </ul>
          </motion.div>
          <motion.div className="relative p-0 z-10 flex flex-col items-center text-center md:text-left"
            whileHover={{ scale: 1.06, rotate: 2 }}
          >
            <h3 className="text-3xl md:text-4xl font-black mb-12 text-cyan-400 uppercase tracking-[.25em] letter-spacing-wide drop-shadow-xl">With AGENTIC AI</h3>
            <ul className="space-y-8 text-2xl text-white/90 font-light">
              <li className="flex items-center gap-4"><span className="text-3xl">✅</span> Reduced costs</li>
              <li className="flex items-center gap-4"><span className="text-3xl">✅</span> 24/7 instant responses</li>
              <li className="flex items-center gap-4"><span className="text-3xl">✅</span> Scales with your business</li>
            </ul>
          </motion.div>
        </motion.section>

        <div className="section-divider" />
        {/* Unified AI Solutions & Process Section */}
        <IndustryProcess />
        <div className="section-divider" />
        {/* Why Agentic AI Section */}
        <motion.section
          className="relative p-10 text-center overflow-visible"
          style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.04) 100%)' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          whileHover={{ scale: 1.01, boxShadow: '0 8px 64px 0 rgba(6,182,212,0.10)' }}
        >
          {/* Floating blurred accent shape */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-32 bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 opacity-20 blur-2xl rounded-full z-0 animate-float-slow" />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent drop-shadow-xl tracking-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            whileHover={{ letterSpacing: '0.15em', color: '#06b6d4', textShadow: '0 2px 32px #06b6d4' }}
          >
            Why Choose <span className="text-white/90">Agentic AI?</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-12 text-left mt-10 relative z-10">
            <div>
              <h3 className="text-xl font-bold mb-4 text-orange-200">Business Outcomes</h3>
              <ul className="space-y-3 text-lg text-white/80">
                <li>• Reduce operational costs by up to <AnimatedCounter value={60} duration={1.5} className="text-orange-400 font-bold text-2xl inline" />%</li>
                <li>• <AnimatedCounter value={24} duration={1.2} className="text-orange-400 font-bold text-2xl inline" />/<AnimatedCounter value={7} duration={1.2} className="text-orange-400 font-bold text-2xl inline" /> instant customer service—no downtime</li>
                <li>• Eliminate manual errors and repetitive tasks</li>
                <li>• Scale your team instantly as your business grows</li>
              </ul>
              <h3 className="text-xl font-bold mt-8 mb-4 text-orange-200">Industries & Use Cases</h3>
              <ul className="space-y-3 text-lg text-white/80">
                <li>• E-commerce: Automated order updates, product Q&A</li>
                <li>• Healthcare: Appointment scheduling, patient support</li>
                <li>• Real Estate: Lead qualification, property info</li>
                <li>• Professional Services: Client onboarding, FAQ</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-orange-200">Security & Integration</h3>
              <ul className="space-y-3 text-lg text-white/80">
                <li>• Enterprise-grade security & compliance</li>
                <li>• Seamless integration with your existing tools</li>
                <li>• GDPR-ready and privacy-focused</li>
                <li>• Ongoing support and continuous improvement</li>
              </ul>
              <h3 className="text-xl font-bold mt-8 mb-4 text-orange-200">Our Promise</h3>
              <ul className="space-y-3 text-lg text-white/80">
                <li>• Dedicated AI experts for your business</li>
                <li>• Transparent pricing, no hidden fees</li>
                <li>• Fast onboarding and personalized setup</li>
              </ul>
            </div>
          </div>
        </motion.section>

        <div className="section-divider" />
        {/* FAQ Section */}
        <section id="faq" className="relative max-w-3xl mx-auto py-44 md:py-[15vw] px-2 sm:px-8 flex flex-col items-center">
          {/* Animated blurred accent shapes, parallax divider, and floating accent dots */}
          <motion.div
            className="absolute -top-48 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] bg-gradient-to-br from-cyan-400 to-white/10 opacity-10 blur-3xl rounded-full z-0 animate-float-slow"
            style={{ filter: 'blur(100px)' }}
            initial={{ y: -40, scale: 0.95, opacity: 0.7 }}
            whileInView={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, type: 'spring' }}
            animate={{ rotate: [0, 8, -8, 0] }}
          />
          <motion.div
            className="absolute -bottom-64 left-1/2 -translate-x-1/2 w-[44rem] h-[44rem] bg-gradient-to-br from-orange-300 to-cyan-400 opacity-10 blur-3xl rounded-full z-0 animate-float-slower"
            style={{ filter: 'blur(120px)' }}
            initial={{ y: 40, scale: 0.95, opacity: 0.7 }}
            whileInView={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, type: 'spring' }}
            animate={{ rotate: [0, -8, 8, 0] }}
          />
          {/* Animated vertical line accent */}
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-cyan-400/60 via-white/0 to-orange-400/60 opacity-60 rounded-full pointer-events-none"
            initial={{ scaleY: 0.7, opacity: 0 }}
            whileInView={{ scaleY: 1, opacity: 1 }}
            animate={{ scaleX: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ zIndex: 1 }}
          />
          {/* Floating accent dots */}
          <motion.span className="absolute left-12 top-1/3 w-4 h-4 bg-cyan-400 rounded-full blur-md opacity-60 animate-float-slow"
            animate={{ y: [0, -10, 10, 0] }} transition={{ duration: 3, repeat: Infinity }} />
          <motion.span className="absolute right-12 bottom-1/4 w-3 h-3 bg-orange-400 rounded-full blur-md opacity-60 animate-float-slower"
            animate={{ y: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} />
          <motion.span className="absolute left-1/4 bottom-1/4 w-2 h-2 bg-cyan-300 rounded-full blur-sm opacity-60 animate-float"
            animate={{ x: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} />
          <FAQAccordion />
        </section>
        <div className="section-divider" />
        {/* Contact Section */}
        <section id="contact" className="relative max-w-2xl mx-auto py-44 md:py-[15vw] px-2 sm:px-8 flex flex-col items-center">
          {/* Animated blurred accent shapes, parallax divider, and floating accent dots */}
          <motion.div
            className="absolute -top-48 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] bg-gradient-to-br from-cyan-400 to-white/10 opacity-10 blur-3xl rounded-full z-0 animate-float-slow"
            style={{ filter: 'blur(100px)' }}
            initial={{ y: -40, scale: 0.95, opacity: 0.7 }}
            whileInView={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, type: 'spring' }}
            animate={{ rotate: [0, 8, -8, 0] }}
          />
          <motion.div
            className="absolute -bottom-64 left-1/2 -translate-x-1/2 w-[44rem] h-[44rem] bg-gradient-to-br from-orange-300 to-cyan-400 opacity-10 blur-3xl rounded-full z-0 animate-float-slower"
            style={{ filter: 'blur(120px)' }}
            initial={{ y: 40, scale: 0.95, opacity: 0.7 }}
            whileInView={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, type: 'spring' }}
            animate={{ rotate: [0, -8, 8, 0] }}
          />
          {/* Animated vertical line accent */}
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-cyan-400/60 via-white/0 to-orange-400/60 opacity-60 rounded-full pointer-events-none"
            initial={{ scaleY: 0.7, opacity: 0 }}
            whileInView={{ scaleY: 1, opacity: 1 }}
            animate={{ scaleX: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ zIndex: 1 }}
          />
          {/* Floating accent dots */}
          <motion.span className="absolute left-12 top-1/3 w-4 h-4 bg-cyan-400 rounded-full blur-md opacity-60 animate-float-slow" />
          <motion.span className="absolute right-12 bottom-1/4 w-3 h-3 bg-orange-400 rounded-full blur-md opacity-60 animate-float-slower" />
          <motion.span className="absolute left-1/4 bottom-1/4 w-2 h-2 bg-cyan-300 rounded-full blur-sm opacity-60 animate-float" />
          <Contact />
        </section>
        <div className="section-divider" />
        {/* Footer Section */}
        <footer className="relative w-full py-24 flex flex-col items-center bg-transparent text-gray-400 text-center text-lg mt-24">
          {/* Animated blurred accent shapes, parallax divider, and floating accent dots */}
          <motion.div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-16 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 opacity-10 blur-2xl rounded-full z-0 animate-float-slow"
            style={{ filter: 'blur(60px)' }}
            initial={{ y: -10, scale: 0.98, opacity: 0.7 }}
            whileInView={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, type: 'spring' }}
            animate={{ rotate: [0, 8, -8, 0] }}
          />
          <motion.span className="absolute left-1/4 top-1/2 w-3 h-3 bg-cyan-400 rounded-full blur-md opacity-60 animate-float-slow"
            animate={{ y: [0, -8, 8, 0] }} transition={{ duration: 3, repeat: Infinity }} />
          <motion.span className="absolute right-1/4 bottom-1/2 w-2 h-2 bg-orange-400 rounded-full blur-md opacity-60 animate-float-slower"
            animate={{ y: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} />
          <div className="relative z-10">
            <p>
              © Agentic AI. All rights reserved. Contact us:{" "}
              <a href="mailto:mauricio.perezflores@gmail.com" className="underline hover:text-cyan-400 transition-colors">
                mauricio.perezflores@gmail.com
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
