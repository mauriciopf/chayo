import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Services from "./components/Services";
import Process from "./components/Process";
import Solutions from "./components/Solutions";
import PricingReplacement from "./components/PricingReplacement";
import Contact from "./components/Contact";
import Mascot from "./components/Mascot";
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
        {/* Automation Service Section */}
        <motion.section
          className="section-glass relative p-10 text-center shadow-2xl border border-gray-800 overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {/* Animated orange glow */}
          <motion.div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-96 h-32 bg-orange-500 opacity-20 blur-3xl rounded-full z-0 animate-pulse"
            aria-hidden="true"
          />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            Automation Service
          </h2>
          <p className="text-lg md:text-xl mb-4 text-orange-100">
            We build a tailored team of AI agents designed to reduce costs for your business with automation tools.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-6 mt-6">
            <motion.div className="flex-1 bg-black/60 rounded-xl p-6 border border-cyan-800 shadow-lg" whileHover={{ scale: 1.04 }}>
              <h4 className="text-xl font-bold mb-2 text-cyan-300">⚡ What you get:</h4>
              <ul className="space-y-1 text-cyan-100 text-left mx-auto max-w-xs">
                <li>✅ Faster responses</li>
                <li>✅ Happier customers</li>
                <li>✅ More time to grow your business</li>
              </ul>
              <p className="mt-4 text-cyan-200 text-sm">💡 DM us “AUTO” to see how it works — or let our AI agent reply 😉</p>
            </motion.div>
          </div>
        </motion.section>

        <div className="section-divider" />
        {/* Chatbot vs AI Agent Comparison Section */}
        <motion.section
          className="section-glass relative p-10 text-center shadow-2xl border border-orange-800 my-16 overflow-hidden"
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
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            Chatbot vs <span className="text-cyan-300">🤖 AI Agent</span>
          </h2>
          <p className="text-lg md:text-xl mb-10 text-cyan-100 font-medium">
            Which One Is Right for Your Business?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            {/* Chatbot Card */}
            <motion.div
              className="rounded-xl bg-gray-800 border border-gray-700 p-8 flex flex-col items-center shadow-lg"
              whileHover={{ scale: 1.04, boxShadow: "0 0 24px #38bdf8" }}
            >
              <div className="text-3xl mb-2">🔹 Chatbot</div>
              <ul className="text-left text-cyan-100 space-y-2 text-base">
                <li>✅ Answers basic FAQs</li>
                <li>✅ Works with scripted flows</li>
                <li>⛔️ Gets stuck outside pre-defined rules</li>
                <li>⛔️ Limited personalization</li>
              </ul>
            </motion.div>
            {/* AI Agent Card */}
            <motion.div
              className="rounded-xl bg-gradient-to-br from-cyan-900 to-blue-900 border border-cyan-700 p-8 flex flex-col items-center shadow-lg"
              whileHover={{ scale: 1.07, boxShadow: "0 0 32px #38bdf8" }}
            >
              <div className="text-3xl mb-2">🔹 AI Agent</div>
              <ul className="text-left text-cyan-50 space-y-2 text-base">
                <li>✅ Understands context & intent</li>
                <li>✅ Handles complex, dynamic tasks</li>
                <li>✅ Can take actions (not just reply)</li>
                <li>✅ Learns and improves over time</li>
              </ul>
            </motion.div>
          </div>
          <motion.p
            className="text-cyan-200 text-lg mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            💡 <span className="font-semibold text-cyan-100">AI Agents are not just smarter</span>—they’re built to automate processes, boost productivity, and grow with your business.
          </motion.p>
          <motion.a
            href="#contact"
            className="inline-block mt-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:from-orange-500 hover:to-orange-700 transition"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
          >
            🚀 Ready to upgrade from a chatbot to a full AI workforce?
          </motion.a>
        </motion.section>

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
