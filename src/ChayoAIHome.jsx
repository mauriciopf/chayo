import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import NewHeader from "./components/NewHeader";
import NewHero from "./components/NewHero";
import VibeSection from "./components/VibeSection";
import TrainingSection from "./components/TrainingSection";
import MarketingSection from "./components/MarketingSection";
import LaunchSection from "./components/LaunchSection";
import HowItWorksSection from "./components/HowItWorksSection";
import ExamplesSection from "./components/ExamplesSection";
import PricingSection from "./components/PricingSection";
import NewFooter from "./components/NewFooter";
import StartACall from "./components/StartACall";
import { motion } from "framer-motion";

export default function ChayoAIHome({ darkMode: parentDarkMode }) {
  const [darkMode, setDarkMode] = useState(parentDarkMode ?? false);
  const [isMobile, setIsMobile] = useState(false);
  const [showStartACall, setShowStartACall] = useState(false);

  useEffect(() => {
    if (parentDarkMode !== undefined) {
      setDarkMode(parentDarkMode);
    }
  }, [parentDarkMode]);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <div className="bg-white text-gray-900 transition-colors duration-700">
      <Helmet>
        <title>Chayo AI – Tu Comadre Digital que Nunca Duerme | AI Business Automation</title>
        <meta
          name="description"
          content="Chayo runs your business like a comadre who never sleeps. AI automation that learns your brand, handles customers 24/7, and grows your revenue. Set up in 5 minutes."
        />
        <meta name="keywords" content="AI comadre, business automation, AI chatbot, customer service automation, Hispanic AI, Latina entrepreneur, automated booking, AI assistant, business growth" />
        <meta name="author" content="Chayo AI" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        
        <meta property="og:title" content="Chayo AI – Tu Comadre Digital que Nunca Duerme" />
        <meta property="og:description" content="AI automation that learns your brand, handles customers 24/7, and grows your revenue. Your digital comadre who never sleeps." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://chayo.ai" />
        <meta property="og:image" content="https://chayo.ai/chayo-logo.svg" />
        <meta property="og:site_name" content="Chayo AI" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="es_MX" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chayo AI – Tu Comadre Digital que Nunca Duerme" />
        <meta name="twitter:description" content="AI automation that learns your brand and handles customers 24/7. Your digital comadre who never sleeps." />
        <meta name="twitter:image" content="https://chayo.ai/chayo-logo.svg" />
        <meta name="twitter:site" content="@ChayoAI" />
        <meta name="twitter:creator" content="@ChayoAI" />
        
        <meta name="theme-color" content="#9333ea" />
        <link rel="canonical" href="https://chayo.ai" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Chayo AI" />
      </Helmet>

      {/* New Landing Page Layout */}
      <NewHeader />
      
      <main className="pt-16 lg:pt-20">
        {/* Hero Section - Fullscreen Phone Simulation */}
        <section id="hero">
          <NewHero />
        </section>

        {/* Section 1 - Give Chayo Her Vibe */}
        <section id="vibe">
          <VibeSection />
        </section>

        {/* Section 2 - Train Her with Your Knowledge */}
        <section id="training">
          <TrainingSection />
        </section>

        {/* Section 3 - Chayo Marketing on Autopilot */}
        <section id="marketing">
          <MarketingSection />
        </section>

        {/* Section 4 - Launch and Let Chayo Handle the Grind */}
        <section id="launch">
          <LaunchSection />
        </section>

        {/* Section 5 - How it Works */}
        <section id="how">
          <HowItWorksSection />
        </section>

        {/* Section 6 - Examples */}
        <section id="examples">
          <ExamplesSection />
        </section>

        {/* Section 7 - Pricing */}
        <section id="pricing">
          <PricingSection />
        </section>
      </main>

      <NewFooter />
      
      {/* StartACall Modal */}
      {showStartACall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowStartACall(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <StartACall onClose={() => setShowStartACall(false)} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
