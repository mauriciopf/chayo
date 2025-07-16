'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Head from 'next/head'

interface StartACallProps {
  darkMode?: boolean;
  setDarkMode: (darkMode: boolean) => void;
  onClose?: () => void;
}

export default function StartACall({ darkMode = true, setDarkMode, onClose }: StartACallProps) {
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    // Simple widget detection
    const checkWidget = () => {
      const widget = document.querySelector('elevenlabs-convai');
      if (widget) {
        console.log('ElevenLabs widget found and ready');
        setWidgetReady(true);
      } else {
        setTimeout(checkWidget, 500);
      }
    };
    
    checkWidget();
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <Head>
        <title>Start Your AI Call - Chayo AI</title>
        <meta name="description" content="Connect with our AI agent for instant business consultation" />
      </Head>
      
      {/* Mobile ElevenLabs Widget - Only visible on mobile */}
      <div 
        className="md:hidden elevenlabs-widget-mobile" 
        dangerouslySetInnerHTML={{ __html: '<elevenlabs-convai agent-id="agent_01jyc95f0be1v9xww6h31366mw"></elevenlabs-convai>' }} 
      />
      
      <div className="text-center">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          AI Call Starting...
        </motion.h1>
        
        <motion.p
          className={`text-xl mb-12 transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {widgetReady ? 'AI Agent Ready - Click the widget to start your call' : 'Initializing AI Agent...'}
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.a
            href="/"
            className={`transition-colors ${
              darkMode 
                ? 'text-cyan-400 hover:text-cyan-300' 
                : 'text-blue-600 hover:text-blue-500'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            ← Back to Home
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}