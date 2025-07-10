import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function MarketingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [activeChannel, setActiveChannel] = useState(0);

  const channels = [
    { name: "WhatsApp", icon: "�", color: "from-green-500 to-emerald-500", message: "¿Puedes ayudarme con precios?", available: true },
    { name: "Web Widget", icon: "🌐", color: "from-blue-500 to-cyan-500", message: "What services do you offer?", available: false, comingSoon: true },
    { name: "Video AI", icon: "🎥", color: "from-purple-500 to-pink-500", message: "I'd like to learn more about your business", available: false, comingSoon: true },
    { name: "Instagram", icon: "�", color: "from-pink-500 to-purple-500", message: "Hi, do you have availability this weekend?", available: false, comingSoon: true },
    { name: "Email", icon: "📧", color: "from-orange-500 to-red-500", message: "Can you send me more information?", available: false, comingSoon: true }
  ];

  useEffect(() => {
    if (isInView) {
      const timer = setInterval(() => {
        setActiveChannel((prev) => (prev + 1) % channels.length);
      }, 2500);
      return () => clearInterval(timer);
    }
  }, [isInView]);

  return (
    <div ref={ref} className="py-20 bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Chayo AI en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
              Múltiples Canales
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un solo inbox inteligente. Todos tus canales. Chayo maneja todo, incluso cuando duermes 😴
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Multi-Channel Hub */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            
            {/* Unified Inbox */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Unified Inbox</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>

              {/* Channel Icons */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                {channels.map((channel, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`relative flex flex-col items-center p-4 rounded-xl transition-all duration-500 ${
                      activeChannel === index && channel.available
                        ? 'bg-gradient-to-br ' + channel.color + ' text-white transform scale-110'
                        : channel.available
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 opacity-60'
                    }`}
                  >
                    <span className="text-2xl mb-1">{channel.icon}</span>
                    <span className="text-xs font-medium">{channel.name}</span>
                    
                    {channel.comingSoon && (
                      <span className="text-xs text-blue-600 font-medium mt-1">
                        Soon
                      </span>
                    )}
                    
                    {activeChannel === index && channel.available && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                      >
                        <span className="text-xs font-bold text-gray-900">!</span>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Active Conversation */}
              <motion.div
                key={activeChannel}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${channels[activeChannel].color} flex items-center justify-center text-white`}>
                    {channels[activeChannel].icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{channels[activeChannel].name}</p>
                    <p className="text-sm text-gray-600">New message</p>
                  </div>
                  <span className="text-xs text-gray-500">now</span>
                </div>
                
                {/* Message */}
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{channels[activeChannel].message}</p>
                </div>
                
                {/* Chayo Response */}
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-3 border border-yellow-200">
                  <p className="text-sm text-gray-700">Hola 👋 Yes we do! Want to book Saturday at 2PM?</p>
                </div>
              </motion.div>

            </div>

          </motion.div>

          {/* Right Side - Example Conversation */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            
            {/* Chat Example */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white mr-3">
                  <span className="text-lg">💬</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Instagram DM</h4>
                  <p className="text-sm text-gray-500">@customer_maria</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Customer Message */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-xs">
                    Hi, do you have availability this weekend?
                  </div>
                </motion.div>

                {/* Chayo Response */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1.5 }}
                  className="flex justify-end"
                >
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg px-4 py-3 max-w-xs">
                    Hola 👋 Yes we do! Want to book Saturday at 2PM?
                  </div>
                </motion.div>

                {/* Customer Reply */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 2 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-xs">
                    Perfect! How much would that be?
                  </div>
                </motion.div>

                {/* Chayo Follow-up */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 2.5 }}
                  className="flex justify-end"
                >
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg px-4 py-3 max-w-xs">
                    That'll be $150. I can send you the booking link! 💅
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Features */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 2 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-gray-900">What Chayo handles:</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: "📅", text: "Books appointments instantly" },
                  { icon: "💰", text: "Quotes prices accurately" },
                  { icon: "❓", text: "Answers common questions" },
                  { icon: "📞", text: "Escalates complex issues" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 2.2 + index * 0.1 }}
                    className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm border"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-gray-700">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 2.5 }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white"
            >
              <h4 className="text-xl font-bold mb-4">24/7 Coverage</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">97%</div>
                  <div className="text-sm opacity-90">Response Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">&lt;30s</div>
                  <div className="text-sm opacity-90">Avg Response</div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
