import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* Background effects */}
      <motion.div
        className="absolute left-1/2 top-0 -translate-x-1/2 w-[60vw] h-40 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 opacity-20 blur-3xl rounded-full z-0"
        aria-hidden="true"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 8, -8, 0] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        {/* Back to Home Button */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </motion.div>
        
        <motion.h1 
          className="text-4xl md:text-6xl font-black text-center mb-8 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent drop-shadow-2xl tracking-widest uppercase"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Privacy Policy
        </motion.h1>
        
        <motion.div 
          className="prose prose-lg prose-invert max-w-none"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="space-y-8 text-gray-900">
            <section>
              <p className="text-gray-600 mb-6">
                <strong>Effective Date:</strong> June 18, 2025
              </p>
              <p className="mb-6">
                At Agentic AI, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">1. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-2">Personal Information</h3>
                  <p>We may collect personal information that you voluntarily provide, including:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Name and contact information (email, phone number)</li>
                    <li>Company information and job title</li>
                    <li>Communication preferences</li>
                    <li>Any information you provide in forms or communications</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-2">Usage Data</h3>
                  <p>We automatically collect certain information about your use of our services:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Device and browser information</li>
                    <li>IP address and location data</li>
                    <li>Pages visited and time spent on our site</li>
                    <li>Referral sources and navigation patterns</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide and improve our AI services</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send you relevant updates and marketing communications (with your consent)</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">3. Data Security</h2>
              <p>We implement enterprise-grade security measures to protect your information:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>End-to-end encryption for data transmission</li>
                <li>Secure data storage with access controls</li>
                <li>Regular security audits and updates</li>
                <li>GDPR and industry standard compliance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">4. Data Sharing</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in these limited circumstances:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>With your explicit consent</li>
                <li>To comply with legal requirements</li>
                <li>With trusted service providers who assist in our operations (under strict confidentiality agreements)</li>
                <li>To protect our rights, property, or safety</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability and restriction of processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">6. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Remember your preferences and settings</li>
                <li>Analyze site traffic and usage patterns</li>
                <li>Improve our services and user experience</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="mt-4">You can manage cookie preferences through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">7. International Data Transfers</h2>
              <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable privacy laws.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">8. Children's Privacy</h2>
              <p>Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy periodically. We will notify you of significant changes by posting the updated policy on our website and updating the effective date.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">10. Contact Us</h2>
              <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-cyan-400/20">
                <p><strong>Email:</strong> <a href="mailto:mauricio.perezflores@gmail.com" className="text-cyan-400 hover:text-orange-400 transition-colors">mauricio.perezflores@gmail.com</a></p>
                <p><strong>Subject:</strong> Privacy Policy Inquiry</p>
              </div>
            </section>

            <section className="border-t border-gray-300 pt-8">
              <p className="text-gray-600 text-center">
                This Privacy Policy is designed to comply with GDPR, CCPA, and other applicable privacy regulations. 
                Your privacy is important to us, and we are committed to maintaining the confidentiality and security of your information.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
