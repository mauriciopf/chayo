'use client'

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import NewHeader from "./NewHeader";
import NewHero from "./NewHero";
import VibeSection from "./VibeSection";
import TrainingSection from "./TrainingSection";
import MarketingSection from "./MarketingSection";
import LaunchSection from "./LaunchSection";
import HowItWorksSection from "./HowItWorksSection";
import ExamplesSection from "./ExamplesSection";
import PricingSection from "./PricingSection";
import NewFooter from "./NewFooter";
import StartACall from "./StartACall";
import BetaBanner from "./BetaBanner";

interface ChayoAIHomeProps {
  darkMode?: boolean;
}

export default function ChayoAIHome({ darkMode: parentDarkMode }: ChayoAIHomeProps) {
  const router = useRouter();
  const locale = useLocale();
  const [darkMode, setDarkMode] = useState(parentDarkMode ?? false);
  const [isMobile, setIsMobile] = useState(false);
  const [showStartACall, setShowStartACall] = useState(false);

  const handleStartCall = () => {
    router.push(`/${locale}/dashboard`);
  };

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
      {/* Beta Banner */}
      <BetaBanner />
      
      {/* New Landing Page Layout */}
      <NewHeader />
      
      <main>
        {/* Hero Section - Fullscreen Phone Simulation */}
        <section id="hero">
          <NewHero onStartCall={handleStartCall} />
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
          <LaunchSection onStartCall={handleStartCall} />
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
          <PricingSection onStartCall={handleStartCall} />
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
            <StartACall 
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onClose={() => setShowStartACall(false)} 
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
