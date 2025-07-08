import React, { useState } from "react";
import { motion } from "framer-motion";

// Modern, sophisticated color palette
const ACCENT = "#18181b";     // Rich charcoal
const ACCENT_LIGHT = "#52525b"; // Warm gray
const ACCENT_SUBTLE = "#a1a1aa"; // Light gray
const NEUTRAL = "#f4f4f5";    // Off-white
const EMERALD = "#10b981";    // Modern emerald accent

const mascots = [
	{
		key: "robot",
		title: "AI Agents",
		description: "24/7 intelligent automation",
		svg: (
			<svg
				width="80"
				height="80"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor={ACCENT_LIGHT} />
						<stop offset="50%" stopColor={ACCENT} />
						<stop offset="100%" stopColor={EMERALD} />
					</linearGradient>
					<filter id="glow">
						<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
						<feMerge> 
							<feMergeNode in="coloredBlur"/>
							<feMergeNode in="SourceGraphic"/>
						</feMerge>
					</filter>
				</defs>
				<rect
					x="20"
					y="30"
					width="80"
					height="60"
					rx="20"
					fill="url(#robotGradient)"
					stroke={EMERALD}
					strokeWidth="3"
					filter="url(#glow)"
				/>
				<circle cx="45" cy="55" r="8" fill={EMERALD}>
					<animate attributeName="r" values="8;6;8" dur="2s" repeatCount="indefinite" />
				</circle>
				<circle cx="75" cy="55" r="8" fill={EMERALD}>
					<animate attributeName="r" values="8;6;8" dur="2s" repeatCount="indefinite" begin="0.5s" />
				</circle>
				<path
					d="M45 75 Q60 90 75 75"
					stroke={EMERALD}
					strokeWidth="4"
					fill="none"
					strokeLinecap="round"
					filter="url(#glow)"
				/>
				<rect x="58" y="15" width="4" height="15" rx="2" fill={ACCENT_LIGHT} />
				<circle cx="60" cy="13" r="4" fill={EMERALD}>
					<animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
				</circle>
			</svg>
		),
	},
	{
		key: "chat",
		title: "Smart Chatbots",
		description: "Natural conversation AI",
		svg: (
			<svg
				width="80"
				height="80"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient id="chatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor={ACCENT} />
						<stop offset="50%" stopColor={ACCENT_LIGHT} />
						<stop offset="100%" stopColor={EMERALD} />
					</linearGradient>
				</defs>
				<ellipse
					cx="60"
					cy="60"
					rx="40"
					ry="30"
					fill="url(#chatGradient)"
					opacity="0.9"
				/>
				<path
					d="M40 80 L30 95 L50 85 Z"
					fill="url(#chatGradient)"
					opacity="0.9"
				/>
				<circle cx="45" cy="60" r="4" fill="#fff">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
				</circle>
				<circle cx="60" cy="60" r="4" fill="#fff">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
				</circle>
				<circle cx="75" cy="60" r="4" fill="#fff">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
				</circle>
			</svg>
		),
	},
	{
		key: "analytics",
		title: "Data Analytics",
		description: "Intelligent insights",
		svg: (
			<svg
				width="80"
				height="80"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient id="analyticsGradient" x1="0%" y1="100%" x2="0%" y2="0%">
						<stop offset="0%" stopColor={ACCENT} />
						<stop offset="50%" stopColor={ACCENT_LIGHT} />
						<stop offset="100%" stopColor={EMERALD} />
					</linearGradient>
				</defs>
				<rect
					x="30"
					y="70"
					width="12"
					height="30"
					rx="6"
					fill="url(#analyticsGradient)"
				>
					<animate attributeName="height" values="30;20;35;30" dur="3s" repeatCount="indefinite" />
					<animate attributeName="y" values="70;80;65;70" dur="3s" repeatCount="indefinite" />
				</rect>
				<rect
					x="54"
					y="50"
					width="12"
					height="50"
					rx="6"
					fill="url(#analyticsGradient)"
				>
					<animate attributeName="height" values="50;40;60;50" dur="3s" repeatCount="indefinite" begin="0.5s" />
					<animate attributeName="y" values="50;60;40;50" dur="3s" repeatCount="indefinite" begin="0.5s" />
				</rect>
				<rect
					x="78"
					y="40"
					width="12"
					height="60"
					rx="6"
					fill="url(#analyticsGradient)"
				>
					<animate attributeName="height" values="60;45;70;60" dur="3s" repeatCount="indefinite" begin="1s" />
					<animate attributeName="y" values="40;55;30;40" dur="3s" repeatCount="indefinite" begin="1s" />
				</rect>
				<path
					d="M25 35 L85 25"
					stroke={EMERALD}
					strokeWidth="3"
					strokeLinecap="round"
					opacity="0.8"
				/>
				<path
					d="M80 20 L85 25 L80 30"
					stroke={EMERALD}
					strokeWidth="3"
					strokeLinecap="round"
					fill="none"
					opacity="0.8"
				/>
			</svg>
		),
	},
	{
		key: "integration",
		title: "System Integration",
		description: "Workflow automation",
		svg: (
			<svg
				width="80"
				height="80"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient id="integrationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor={ACCENT_LIGHT} />
						<stop offset="50%" stopColor={ACCENT} />
						<stop offset="100%" stopColor={EMERALD} />
					</linearGradient>
				</defs>
				<circle cx="30" cy="40" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="90" cy="40" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="30" cy="80" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="90" cy="80" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="60" cy="60" r="15" fill="url(#integrationGradient)" />
				
				<path d="M30 40 L60 60" stroke={EMERALD} strokeWidth="3" strokeLinecap="round">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
				</path>
				<path d="M90 40 L60 60" stroke={EMERALD} strokeWidth="3" strokeLinecap="round">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
				</path>
				<path d="M30 80 L60 60" stroke={EMERALD} strokeWidth="3" strokeLinecap="round">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1s" />
				</path>
				<path d="M90 80 L60 60" stroke={EMERALD} strokeWidth="3" strokeLinecap="round">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1.5s" />
				</path>
				
				<circle cx="60" cy="60" r="6" fill="#fff" opacity="0.9" />
			</svg>
		),
	},
];

const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 1 } },
};

const buttonVariants = {
  hover: { scale: 1.12, boxShadow: "0 0 64px 16px #fb923c, 0 0 128px 32px #06b6d4" },
  tap: { scale: 0.96 },
};

const Hero = ({ darkMode = false }) => {
  const [hoveredMascot, setHoveredMascot] = useState(null);
  const [selectedMascot, setSelectedMascot] = useState(null);
  
  // Detect mobile to reduce animations
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
  <section 
    className="relative bg-white text-gray-900 py-16 xs:py-20 sm:py-32 md:py-40 text-center overflow-hidden min-h-screen flex flex-col items-center" 
    style={{ 
      touchAction: 'pan-y pinch-zoom',
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain'
    }}
  >
    {/* Multi-layered animated 3D gradients - simplified for mobile */}
    <div
      className="absolute left-1/2 top-0 -translate-x-1/2 w-[120vw] sm:w-[100vw] h-[40vh] sm:h-[60vh] bg-gradient-to-tr from-emerald-400/20 via-zinc-400/10 to-emerald-600/20 opacity-60 blur-3xl rounded-full z-0 animate-float-slow"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    />
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[70vw] h-[24vh] sm:h-[40vh] bg-gradient-to-br from-emerald-400/60 via-white/10 to-zinc-400/60 opacity-30 blur-2xl rounded-full z-0 animate-float"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    />
    {/* Simplified floating elements - less on mobile */}
    {!isMobile && [...Array(4)].map((_, i) => (
      <span
        key={i}
        className="absolute rounded-full blur-2xl pointer-events-none opacity-30"
        style={{
          width: 16 + i * 3,
          height: 16 + i * 3,
          background: i % 2 === 0 ? '#18181b' : '#10b981',
          top: `${15 + i * 15}%`,
          left: `${20 + i * 15}%`,
          zIndex: 1,
          animation: `float-y ${4 + i}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`
        }}
      />
    ))}
    {/* Floating glassy light streak - CSS animation only */}
    <div
      className="absolute left-1/2 top-1/3 -translate-x-1/2 w-2/3 sm:w-1/2 h-6 sm:h-10 bg-gradient-to-r from-white/40 via-emerald-400/20 to-zinc-400/20 opacity-20 sm:opacity-30 blur-xl rounded-full z-10 animate-float"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    />
    {/* Floating mascot/icon - CSS animation only */}
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none select-none"
      style={{ opacity: 0.1 }}
    >
      <span className="text-[2rem] xs:text-[3rem] sm:text-[5rem] md:text-[8rem] drop-shadow-lg animate-float-slow">
        🤖
      </span>
    </div>
    <div className="relative z-20 w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center" style={{ touchAction: 'pan-y pinch-zoom' }}>
      <motion.h1
        className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-6 sm:mb-8 md:mb-10 bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent drop-shadow-sm tracking-tight leading-tight text-center"
        initial={isMobile ? { opacity: 1 } : "hidden"}
        animate="visible"
        variants={isMobile ? {} : heroVariants}
      >
        <span className="block text-gray-900/90 font-extralight tracking-normal mb-2">AI Automation</span>
        <span className="block bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent font-medium">Solutions</span>
      </motion.h1>
      <motion.p
        className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-10 md:mb-12 text-gray-600 max-w-sm sm:max-w-md md:max-w-lg mx-auto font-light leading-relaxed text-center px-2"
        initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={isMobile ? {} : { delay: 0.1, duration: 0.8 }}
      >
        Transform your business with intelligent automation, chatbots, and <span className="text-emerald-500 font-medium">24/7 AI agents</span>.
      </motion.p>
      <motion.a
        href="http://chayo.ai/#/startaicall"
        className="inline-block w-full xs:w-auto bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-4 xs:px-10 xs:py-4 sm:px-12 sm:py-5 rounded-lg font-medium text-base xs:text-lg sm:text-xl shadow-md hover:shadow-lg hover:scale-105 focus:scale-95 transition-all duration-200"
        variants={isMobile ? {} : buttonVariants}
        whileHover={isMobile ? {} : "hover"}
        whileTap={isMobile ? {} : "tap"}
        initial={isMobile ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={isMobile ? {} : { delay: 0.2, duration: 0.6 }}
        style={{ touchAction: 'manipulation' }}
      >
        Get Started
      </motion.a>
    </div>

    {/* Interactive Mascots Section - Mobile Optimized */}
    <motion.div
      className="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 mt-16 sm:mt-20 md:mt-24"
      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={isMobile ? {} : { delay: 0.3, duration: 0.6 }}
      style={{ touchAction: 'pan-y pinch-zoom' }}
    >
      {/* Mascot Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
        {mascots.map((mascot, index) => (
          <motion.div
            key={mascot.key}
            className="relative group"
            initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={isMobile ? {} : { duration: 0.6, delay: 0.4 + index * 0.05 }}
            onHoverStart={() => setHoveredMascot(mascot.key)}
            onHoverEnd={() => setHoveredMascot(null)}
            onClick={() => setSelectedMascot(selectedMascot === mascot.key ? null : mascot.key)}
          >
            {/* Mascot Icon Container */}
            <motion.div
              className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shadow-xl border-2 cursor-pointer transition-all duration-300 mx-auto bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200/50 backdrop-blur-lg ${hoveredMascot === mascot.key ? 'shadow-2xl scale-110' : ''}"
              whileHover={{ 
                scale: 1.15, 
                rotate: 5,
                boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)"
              }}
              whileTap={{ scale: 0.95, rotate: -5 }}
              aria-label={`${mascot.title} - ${mascot.description}`}
              role="button"
              tabIndex={0}
            >
              {/* Animated Background Glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/20 via-emerald-300/20 to-zinc-400/20"
                animate={{
                  opacity: hoveredMascot === mascot.key ? 0.8 : 0,
                  scale: hoveredMascot === mascot.key ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
              />
              
              {/* SVG Icon */}
              <div className="relative z-10 w-12 h-12 sm:w-16 sm:h-16">
                {mascot.svg}
              </div>
            </motion.div>

            {/* Title and Description */}
            <motion.div 
              className="text-center mt-4"
              animate={{
                y: hoveredMascot === mascot.key ? -2 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="font-bold text-sm md:text-base mb-1 text-gray-900/90">
                {mascot.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-600/80 max-w-32 mx-auto leading-relaxed">
                {mascot.description}
              </p>
            </motion.div>

            {/* Hover Tooltip */}
            <motion.div
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg z-30 bg-white/95 text-gray-900 border border-gray-200/50 backdrop-blur-lg"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{
                opacity: hoveredMascot === mascot.key ? 1 : 0,
                scale: hoveredMascot === mascot.key ? 1 : 0.8,
                y: hoveredMascot === mascot.key ? 0 : 10,
              }}
              transition={{ duration: 0.2 }}
              style={{ pointerEvents: 'none' }}
            >
              Click to learn more
              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-white/95" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Expanded Details Panel */}
      {selectedMascot && (
        <motion.div
          className="mt-12 p-6 md:p-8 rounded-2xl border-2 bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200/50 backdrop-blur-lg shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
        >
          {(() => {
            const mascot = mascots.find(m => m.key === selectedMascot);
            return (
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-900">
                  {mascot.title}
                </h3>
                <p className="text-base md:text-lg mb-6 text-gray-700 max-w-2xl mx-auto">
                  {mascot.description}
                </p>
                <motion.button
                  className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMascot(null)}
                >
                  Close Details
                </motion.button>
              </div>
            );
          })()}
        </motion.div>
      )}
    </motion.div>
  </section>
  );
};

export default Hero;
