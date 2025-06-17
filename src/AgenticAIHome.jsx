import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Contact from "./components/Contact";
import { motion } from "framer-motion";
import AnimatedCounter from "./components/AnimatedCounter";
import DemoModal from "./components/DemoModal";
import FAQAccordion from "./components/FAQAccordion";
import ScrollToTopButton from "./components/ScrollToTopButton";

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

      <main className="pt-16 md:pt-20 max-w-7xl mx-auto px-2 md:px-4 space-y-12 md:space-y-20">
        {/* Animated CTA Section */}
        <motion.section
          className="section-glass relative p-10 text-center shadow-2xl border border-gray-800 overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {/* Animated orange glow */}
          <motion.div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-32 bg-orange-500 opacity-30 blur-3xl rounded-full z-0 animate-pulse"
            aria-hidden="true"
          />
          <motion.h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent" initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 1, delay: 0.2 }}>
            🚀 Ready to see <span className="text-orange-300">AGENTIC AI</span> in action?
          </motion.h2>
          <motion.p className="text-lg md:text-xl mb-8 text-orange-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            Let our AI agents show you how they can automate your Instagram, WhatsApp, SMS, and even voice calls — in real time.
          </motion.p>
          <motion.a
            href="#contact"
            className="inline-block bg-gradient-to-r from-orange-400 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:from-orange-500 hover:to-orange-700 hover:scale-105 focus:scale-95 transition-all"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
          >
            👉 Request a Demo
          </motion.a>
          <motion.p className="mt-8 text-orange-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            With Agentic AI, your business can automatically reply to customer inquiries — instantly, 24/7 — using smart, customized AI agents designed just for your brand.
          </motion.p>
          <motion.p className="mt-2 text-orange-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            ✨ Whether it’s product questions, order updates, or appointment bookings — we’ve got it handled.
          </motion.p>
        </motion.section>

        <div className="section-divider" />
        {/* Value Proposition Section */}
        <motion.section
          className="section-glass relative grid md:grid-cols-2 gap-8 items-center overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {/* Animated orange glow */}
          <motion.div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-32 bg-orange-500 opacity-20 blur-3xl rounded-full z-0 animate-pulse"
            aria-hidden="true"
          />
          <motion.div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-800 z-10" whileHover={{ scale: 1.03 }}>
            <h3 className="text-2xl font-bold mb-4 text-red-400 flex items-center gap-2">🔴 In-House</h3>
            <ul className="space-y-2 text-lg text-gray-300">
              <li>✖️ Higher costs</li>
              <li>✖️ Slower response times</li>
              <li>✖️ Limited scalability</li>
            </ul>
          </motion.div>
          <motion.div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-800 z-10" whileHover={{ scale: 1.05 }}>
            <h3 className="text-2xl font-bold mb-4 text-orange-200 flex items-center gap-2">🟠 With AGENTIC AI</h3>
            <ul className="space-y-2 text-lg text-white">
              <li>✅ Reduced costs</li>
              <li>✅ 24/7 instant responses</li>
              <li>✅ Scales with your business</li>
            </ul>
          </motion.div>
        </motion.section>

        <div className="section-divider" />
        {/* What We Offer Section (modern, no cards) */}
        <motion.section
          className="section-glass relative p-10 md:p-16 text-center shadow-2xl border border-orange-800 overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-[32rem] h-32 bg-gradient-to-r from-orange-500 via-cyan-400 to-orange-400 opacity-20 blur-3xl rounded-full z-0 animate-pulse"
            aria-hidden="true"
          />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-10 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            What We Offer
          </h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
              <span className="text-6xl mb-4 bg-gradient-to-br from-orange-400 via-orange-300 to-yellow-200 bg-clip-text text-transparent">🤖</span>
              <h3 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">AI Automation Agents</h3>
              <p className="text-orange-100 text-lg opacity-90 leading-relaxed max-w-xs">Automate customer support, lead qualification, and more with intelligent AI agents that work 24/7 for your business.</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
              <span className="text-6xl mb-4 bg-gradient-to-br from-cyan-400 via-blue-400 to-cyan-200 bg-clip-text text-transparent">💬</span>
              <h3 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">Omnichannel Messaging</h3>
              <p className="text-cyan-100 text-lg opacity-90 leading-relaxed max-w-xs">Connect with customers on Instagram, WhatsApp, SMS, and voice — all managed by smart automation.</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
              <span className="text-6xl mb-4 bg-gradient-to-br from-orange-400 via-cyan-400 to-yellow-200 bg-clip-text text-transparent">📊</span>
              <h3 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">Data Insights & Analytics</h3>
              <p className="text-orange-100 text-lg opacity-90 leading-relaxed max-w-xs">Unlock actionable insights and automate reporting to drive smarter business decisions.</p>
            </div>
          </div>
        </motion.section>

        <div className="section-divider" />
        {/* Why Agentic AI Section */}
        <motion.section
          className="section-glass relative p-10 text-center shadow-2xl border border-orange-800 overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {/* Animated orange glow */}
          <motion.div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-32 bg-orange-500 opacity-20 blur-3xl rounded-full z-0 animate-pulse"
            aria-hidden="true"
          />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            Why Choose <span className="text-orange-300">Agentic AI?</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-left mt-6">
            <div>
              <h3 className="text-xl font-bold mb-2 text-orange-200">Business Outcomes</h3>
              <ul className="space-y-2 text-orange-100 text-base">
                <li>• Reduce operational costs by up to <AnimatedCounter value={60} duration={1.5} className="text-orange-400 font-bold text-2xl inline" />%</li>
                <li>• <AnimatedCounter value={24} duration={1.2} className="text-orange-400 font-bold text-2xl inline" />/<AnimatedCounter value={7} duration={1.2} className="text-orange-400 font-bold text-2xl inline" /> instant customer service—no downtime</li>
                <li>• Eliminate manual errors and repetitive tasks</li>
                <li>• Scale your team instantly as your business grows</li>
              </ul>
              <h3 className="text-xl font-bold mt-6 mb-2 text-orange-200">Industries & Use Cases</h3>
              <ul className="space-y-2 text-orange-100 text-base">
                <li>• E-commerce: Automated order updates, product Q&A</li>
                <li>• Healthcare: Appointment scheduling, patient support</li>
                <li>• Real Estate: Lead qualification, property info</li>
                <li>• Professional Services: Client onboarding, FAQ</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-orange-200">Security & Integration</h3>
              <ul className="space-y-2 text-orange-100 text-base">
                <li>• Enterprise-grade security & compliance</li>
                <li>• Seamless integration with your existing tools</li>
                <li>• GDPR-ready and privacy-focused</li>
                <li>• Ongoing support and continuous improvement</li>
              </ul>
              <h3 className="text-xl font-bold mt-6 mb-2 text-orange-200">Our Promise</h3>
              <ul className="space-y-2 text-orange-100 text-base">
                <li>• Dedicated AI experts for your business</li>
                <li>• Transparent pricing, no hidden fees</li>
                <li>• Fast onboarding and personalized setup</li>
              </ul>
            </div>
          </div>
        </motion.section>

        <div className="section-divider" />
        {/* FAQ Section */}
        <FAQAccordion />
        <div className="section-divider" />
        {/* Contact Section */}
        <Contact />
      </main>
      <Footer darkMode={darkMode} />
    </div>
  );
}
