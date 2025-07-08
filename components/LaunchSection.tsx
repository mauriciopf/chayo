import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AnimatedCounter from "./AnimatedCounter";

interface LaunchSectionProps {
  onStartCall?: () => void;
}

export default function LaunchSection({ onStartCall }: LaunchSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [currentStat, setCurrentStat] = useState(0);
  const router = useRouter();

  const handleLaunchAgent = () => {
    router.push('/auth');
  };

  const handleBookDemo = () => {
    router.push('/auth');
  };

  const stats = [
    { label: "Bookings made", value: 6, icon: "📅" },
    { label: "Conversations handled", value: 31, icon: "💬" },
    { label: "Sales closed", value: 3, icon: "💰" },
    { label: "Follow-ups sent", value: 12, icon: "📧" }
  ];

  useEffect(() => {
    if (isInView) {
      const timer = setInterval(() => {
        setCurrentStat((prev) => (prev + 1) % stats.length);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [isInView]);

  return (
    <div ref={ref} className="py-20 bg-gradient-to-br from-red-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Launch and Let Chayo{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">
              Handle the Grind
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch your business run itself while you focus on what matters most
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Stats Dashboard */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            
            {/* Dashboard Header */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Today's Results</h3>
                  <p className="text-gray-600">Chayo's daily performance</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`p-4 rounded-xl transition-all duration-500 ${
                      currentStat === index
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white transform scale-105'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">{stat.icon}</div>
                      <div className="text-2xl font-bold">
                        <AnimatedCounter value={stat.value} />
                      </div>
                      <div className="text-xs opacity-90">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Performance Summary */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.5 }}
                className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Revenue Generated</p>
                    <p className="text-2xl font-bold text-green-900">$2,450</p>
                  </div>
                  <div className="text-green-600">
                    <span className="text-3xl">📈</span>
                  </div>
                </div>
              </motion.div>

            </div>

          </motion.div>

          {/* Right Side - Chat Example */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            
            {/* Business Owner Chat */}
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
              
              {/* Business Owner Message */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 }}
                className="flex justify-end"
              >
                <div className="bg-blue-500 text-white rounded-lg px-4 py-3 max-w-xs">
                  Chayo, how's business today?
                </div>
              </motion.div>

              {/* Chayo's Detailed Response */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.5 }}
                className="flex justify-start"
              >
                <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-lg px-4 py-3 max-w-sm border border-red-200">
                  Booked 6 clients, replied to 31 messages, and closed 3 deals. You chill, I hustle. 💼
                </div>
              </motion.div>

              {/* Follow-up stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 2 }}
                className="flex justify-start"
              >
                <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-lg px-4 py-3 max-w-sm border border-red-200">
                  Also sent 12 follow-up emails and updated your calendar. Revenue today: $2,450 ✨
                </div>
              </motion.div>

            </div>

            {/* Benefits List */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 2.5 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-gray-900">While you sleep, Chayo:</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: "🌙", text: "Works 24/7 without breaks" },
                  { icon: "⚡", text: "Responds in under 30 seconds" },
                  { icon: "🎯", text: "Never misses a lead" },
                  { icon: "💎", text: "Maintains your brand voice" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 2.7 + index * 0.1 }}
                    className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm border"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-gray-700">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 3 }}
          className="text-center mt-16"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-4xl mx-auto">
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Ready to automate your business with Chayo?
            </h3>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of business owners who've gone from overwhelmed to automated
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLaunchAgent}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                🔵 Launch My Agent
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBookDemo}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-red-600 hover:text-red-600 transition-all duration-300"
              >
                ⚪️ Book a Free Demo
              </motion.button>
            </div>

            {/* Trust Indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 3.5 }}
              className="flex justify-center items-center space-x-8 mt-8 text-sm text-gray-500"
            >
              <div className="flex items-center space-x-2">
                <span>✅</span>
                <span>5-minute setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🔒</span>
                <span>No contracts</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>💰</span>
                <span>30-day guarantee</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
