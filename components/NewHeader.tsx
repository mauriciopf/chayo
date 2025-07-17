'use client'

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useTranslations, useLocale } from 'next-intl';

export default function NewHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations();
  const locale = useLocale();
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);

  // Simple mobile detection (if not imported)
  const isMobile = typeof window !== 'undefined' && (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // PWA install prompt handler
  const handleFreeTrialClick = () => {
    router.push(`/${locale}/dashboard`);
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100' 
          : 'bg-white/80 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center cursor-pointer"
            onClick={() => scrollToSection('hero')}
          >
            {/* Sleek Text Logo */}
            <div className="relative">
              <motion.h1 
                className="text-3xl lg:text-4xl font-black tracking-tight"
                whileHover={{ scale: 1.02 }}
              >
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  Chayo
                </span>
                
                {/* Animated dot */}
                <motion.span
                  className="inline-block w-2 h-2 lg:w-2.5 lg:h-2.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full ml-1"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p 
                className="text-xs lg:text-sm text-gray-500 font-medium -mt-1 tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {t('navigation.tagline')}
              </motion.p>
              
              {/* Subtle background glow effect */}
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-orange-400/20 rounded-xl blur-xl opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { text: t('navigation.howItWorks'), id: "how", icon: "⚡" },
              { text: t('navigation.examples'), id: "examples", icon: "🎯" },
              { text: t('navigation.pricing'), id: "pricing", icon: "💎" }
            ].map((item, index) => (
              <motion.button
                key={index}
                onClick={() => scrollToSection(item.id)}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative px-4 py-2 text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 rounded-xl hover:bg-purple-50 group"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-sm group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                  <span>{item.text}</span>
                </span>
                
                {/* Animated underline */}
                <motion.div
                  className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                  whileHover={{ 
                    width: "80%",
                    x: "-50%"
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              // Authenticated user buttons
              <>
                <motion.button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 rounded-xl hover:bg-gray-50"
                >
                  {t('navigation.dashboard')}
                </motion.button>
                
                <motion.button
                  onClick={handleSignOut}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-gray-700 hover:text-red-600 font-medium transition-all duration-300 rounded-xl hover:bg-gray-50"
                >
                  {t('navigation.signOut')}
                </motion.button>
              </>
            ) : (
              // Guest user buttons
              <>
                <motion.button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-gray-700 hover:text-purple-600 font-medium transition-all duration-300 rounded-xl hover:bg-gray-50"
                >
                  {t('navigation.signIn')}
                </motion.button>
                
                <motion.button
                  onClick={handleFreeTrialClick}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />
                  <span className="relative flex items-center space-x-2">
                    <span>Free Trial</span>
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      →
                    </motion.span>
                  </span>
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-purple-600 transition-colors duration-300"
          >
            <motion.div
              animate={isMenuOpen ? { rotate: 180 } : { rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </motion.div>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isMenuOpen ? 1 : 0, 
            height: isMenuOpen ? "auto" : 0 
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="lg:hidden overflow-hidden relative z-[70]"
        >
          {/* Background overlay for mobile menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[65]"
              onClick={() => setIsMenuOpen(false)}
            />
          )}
          
          <motion.div 
            className="py-6 space-y-4 border-t border-gray-100 bg-white/98 backdrop-blur-xl rounded-b-2xl shadow-2xl relative z-[70] border-l border-r border-b border-gray-200/50"
            initial={{ y: -20 }}
            animate={{ y: isMenuOpen ? 0 : -20 }}
            transition={{ duration: 0.3 }}
          >
            {[
              { text: "How it Works", id: "how", icon: "⚡" },
              { text: "Examples", id: "examples", icon: "🎯" },
              { text: "Pricing", id: "pricing", icon: "💎" }
            ].map((item, index) => (
              <motion.button
                key={index}
                onClick={() => scrollToSection(item.id)}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-medium transition-all duration-300 rounded-xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.text}</span>
              </motion.button>
            ))}
            
            {/* Mobile CTA */}
            <motion.button
              onClick={handleFreeTrialClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center space-x-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span>Free Trial</span>
              <span>🚀</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      {/* PWA install prompt modal/alert */}
      {showPwaPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-2">Install Chayo AI</h2>
            <p className="mb-4">For the best experience, install Chayo AI as a PWA from your browser menu.<br/>Tap <b>Share</b> &rarr; <b>Add to Home Screen</b> on iOS, or <b>Install App</b> on Android.</p>
            <button onClick={() => setShowPwaPrompt(false)} className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">Close</button>
          </div>
        </div>
      )}
    </motion.header>
  );
}
