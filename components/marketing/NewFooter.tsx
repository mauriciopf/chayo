"use client"

import { motion } from "framer-motion";
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from "next/navigation";

export default function NewFooter() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // Get current path without locale prefix
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  const handleBookDemo = () => {
    router.push(`/${locale}/auth`);
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mb-12">
          
          {/* Brand Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold">{t('brand')}</h3>
                <p className="text-gray-400 text-sm">{t('tagline')}</p>
              </div>
            </div>
            
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              {t('description')}
            </p>

            {/* Language Toggle */}
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-gray-400 text-sm">{t('language')}</span>
              <div className="flex bg-gray-800 rounded-full p-1">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                    locale === 'en' 
                      ? 'bg-white text-gray-900' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🇺🇸 EN
                </button>
                <button
                  onClick={() => handleLanguageChange('es')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                    locale === 'es' 
                      ? 'bg-white text-gray-900' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🇲🇽 ES
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {[
                { icon: "💬", label: "WhatsApp", href: "https://wa.me/your-number" },
                { icon: "📷", label: "Instagram", href: "https://instagram.com/chayoai" },
                { icon: "💼", label: "LinkedIn", href: "https://linkedin.com/company/chayoai" }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-300"
                  aria-label={social.label}
                >
                  <span className="text-lg">{social.icon}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold mb-4">{t('quickLinks')}</h4>
            <ul className="space-y-3">
              {[
                { text: t('howItWorks'), href: "#how-it-works" },
                { text: t('examples'), href: "#examples" },
                { text: t('pricing'), href: "#pricing" },
                { text: t('privacy'), href: "/privacy" },
                { text: t('terms'), href: "/terms" }
              ].map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold mb-4">{t('getInTouch')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <span className="text-purple-400">📧</span>
                <a href="mailto:hello@chayo.ai" className="text-gray-400 hover:text-white transition-colors duration-300">
                  hello@chayo.ai
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-green-400">💬</span>
                <a href="https://wa.me/your-number" className="text-gray-400 hover:text-white transition-colors duration-300">
                  {t('support')}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-blue-400">📞</span>
                <span className="text-gray-400">24/7 AI {t('support')}</span>
              </li>
            </ul>

            {/* Demo Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookDemo}
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              {t('bookDemo')}
            </motion.button>
          </motion.div>

        </div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-gray-800 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              © 2025 Chayo AI. {t('allRightsReserved')}
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white transition-colors duration-300">
                {t('privacy')}
              </a>
              <a href="/terms" className="hover:text-white transition-colors duration-300">
                {t('terms')}
              </a>
              <a href="#cookies" className="hover:text-white transition-colors duration-300">
                {t('trustSafety')}
              </a>
            </div>

          </div>
        </motion.div>

      </div>
    </footer>
  );
}
