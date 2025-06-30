import React, { useState } from "react";
import { motion } from "framer-motion";

const ORANGE = "#E87811";
const ORANGE_LIGHT = "#FFB066";
const ORANGE_DARK = "#B85C0A";
const CYAN = "#06B6D4";
const VIOLET = "#8B5CF6";

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
						<stop offset="0%" stopColor={ORANGE_LIGHT} />
						<stop offset="50%" stopColor={ORANGE} />
						<stop offset="100%" stopColor={ORANGE_DARK} />
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
					stroke={CYAN}
					strokeWidth="3"
					filter="url(#glow)"
				/>
				<circle cx="45" cy="55" r="8" fill={CYAN}>
					<animate attributeName="r" values="8;6;8" dur="2s" repeatCount="indefinite" />
				</circle>
				<circle cx="75" cy="55" r="8" fill={CYAN}>
					<animate attributeName="r" values="8;6;8" dur="2s" repeatCount="indefinite" begin="0.5s" />
				</circle>
				<path
					d="M45 75 Q60 90 75 75"
					stroke={CYAN}
					strokeWidth="4"
					fill="none"
					strokeLinecap="round"
					filter="url(#glow)"
				/>
				<rect x="58" y="15" width="4" height="15" rx="2" fill={ORANGE} />
				<circle cx="60" cy="13" r="4" fill={CYAN}>
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
						<stop offset="0%" stopColor={CYAN} />
						<stop offset="50%" stopColor={VIOLET} />
						<stop offset="100%" stopColor={ORANGE} />
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
						<stop offset="0%" stopColor={ORANGE_DARK} />
						<stop offset="50%" stopColor={ORANGE} />
						<stop offset="100%" stopColor={ORANGE_LIGHT} />
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
					stroke={CYAN}
					strokeWidth="3"
					strokeLinecap="round"
					opacity="0.8"
				/>
				<path
					d="M80 20 L85 25 L80 30"
					stroke={CYAN}
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
						<stop offset="0%" stopColor={VIOLET} />
						<stop offset="50%" stopColor={CYAN} />
						<stop offset="100%" stopColor={ORANGE} />
					</linearGradient>
				</defs>
				<circle cx="30" cy="40" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="90" cy="40" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="30" cy="80" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="90" cy="80" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="60" cy="60" r="15" fill="url(#integrationGradient)" />
				
				<path d="M30 40 L60 60" stroke={CYAN} strokeWidth="3" strokeLinecap="round">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
				</path>
				<path d="M90 40 L60 60" stroke={CYAN} strokeWidth="3" strokeLinecap="round">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
				</path>
				<path d="M30 80 L60 60" stroke={CYAN} strokeWidth="3" strokeLinecap="round">
					<animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1s" />
				</path>
				<path d="M90 80 L60 60" stroke={CYAN} strokeWidth="3" strokeLinecap="round">
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

  return (
  <section className={`relative ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} py-16 xs:py-20 sm:py-32 md:py-56 text-center overflow-hidden min-h-screen flex flex-col items-center justify-center`}>
    {/* Multi-layered animated 3D gradients and glassy overlays - mobile optimized */}
    <motion.div
      className="absolute left-1/2 top-0 -translate-x-1/2 w-[120vw] sm:w-[100vw] h-[40vh] sm:h-[60vh] bg-gradient-to-tr from-orange-400 via-cyan-400 to-violet-500 opacity-40 blur-3xl rounded-full z-0 animate-float-slow"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 0.4, scale: 1.1 }}
      transition={{ duration: 1.2 }}
    />
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[70vw] h-[24vh] sm:h-[40vh] bg-gradient-to-br from-cyan-400/60 via-white/10 to-orange-400/60 opacity-30 blur-2xl rounded-full z-0 animate-float"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.3, scale: 1 }}
      transition={{ duration: 1.6, delay: 0.2 }}
    />
    {/* Parallax floating sparkles and light streaks - hide some on mobile */}
    {[...Array(8)].map((_, i) => (
      <motion.span
        key={i}
        className={`absolute rounded-full blur-2xl pointer-events-none ${i > 3 ? 'hidden xs:block' : ''}`}
        style={{
          width: 24 + i * 4,
          height: 24 + i * 4,
          background: i % 2 === 0 ? '#E87811' : i % 3 === 0 ? '#06b6d4' : '#fff',
          top: `${10 + i * 9}%`,
          left: `${15 + i * 10}%`,
          opacity: 0.4 + (i % 3) * 0.1,
          zIndex: 1,
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 0.7, scale: 1, y: [0, -12, 12, 0] }}
        transition={{ duration: 4 + i, repeat: Infinity, repeatType: 'mirror', delay: i * 0.2 }}
      />
    ))}
    {/* Floating glassy light streak - smaller on mobile */}
    <motion.div
      className="absolute left-1/2 top-1/3 -translate-x-1/2 w-2/3 sm:w-1/2 h-8 sm:h-12 bg-gradient-to-r from-white/60 via-cyan-400/40 to-orange-400/40 opacity-30 blur-2xl rounded-full z-10 animate-float"
      aria-hidden="true"
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 0.3, scaleX: 1 }}
      transition={{ duration: 2.2, delay: 0.6 }}
    />
    {/* Floating mascot/icon, behind text - responsive size */}
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none select-none"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 0.13 }}
      transition={{ delay: 1.1, duration: 1.2, type: "spring" }}
    >
      <span className="text-[2rem] xs:text-[3rem] sm:text-[5rem] md:text-[8rem] drop-shadow-lg animate-float-slow opacity-40">
        🤖
      </span>
    </motion.div>
    <div className="relative z-20 w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center">
      <motion.h1
        className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-6 sm:mb-8 md:mb-10 bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent drop-shadow-sm tracking-tight leading-tight text-center"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        <span className={`block ${darkMode ? 'text-white/90' : 'text-gray-900/90'} font-extralight tracking-normal mb-2`}>AI Automation</span>
        <span className="block bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent font-medium">Solutions</span>
      </motion.h1>
      <motion.p
        className={`text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-10 md:mb-12 ${darkMode ? 'text-white/70' : 'text-gray-600'} max-w-sm sm:max-w-md md:max-w-lg mx-auto font-light leading-relaxed text-center px-2`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        Transform your business with intelligent automation, chatbots, and <span className="text-orange-400 font-medium">24/7 AI agents</span>.
      </motion.p>
      <motion.a
        href="http://ageantic.ai/#/startaicall"
        className="inline-block w-full xs:w-auto bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 text-white px-8 py-4 xs:px-10 xs:py-4 sm:px-12 sm:py-5 rounded-full font-semibold text-base xs:text-lg sm:text-xl shadow-lg hover:shadow-xl hover:scale-105 focus:scale-95 transition-all duration-300 backdrop-blur-sm border border-white/20"
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.7 }}
      >
        Get Started
      </motion.a>
    </div>

    {/* Interactive Mascots Section - Integrated */}
    <motion.div
      className="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 mt-16 sm:mt-20 md:mt-24"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    >
      {/* Mascot Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
        {mascots.map((mascot, index) => (
          <motion.div
            key={mascot.key}
            className="relative group"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.7 + index * 0.2 }}
            onHoverStart={() => setHoveredMascot(mascot.key)}
            onHoverEnd={() => setHoveredMascot(null)}
            onClick={() => setSelectedMascot(selectedMascot === mascot.key ? null : mascot.key)}
          >
            {/* Mascot Icon Container */}
            <motion.div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shadow-xl border-2 cursor-pointer transition-all duration-300 mx-auto ${
                darkMode 
                  ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700/50 backdrop-blur-lg' 
                  : 'bg-gradient-to-br from-white/60 to-gray-100/60 border-gray-200/50 backdrop-blur-lg'
              } ${hoveredMascot === mascot.key ? 'shadow-2xl scale-110' : ''}`}
              whileHover={{ 
                scale: 1.15, 
                rotate: 5,
                boxShadow: darkMode 
                  ? "0 20px 40px rgba(6, 182, 212, 0.4)" 
                  : "0 20px 40px rgba(232, 120, 17, 0.3)"
              }}
              whileTap={{ scale: 0.95, rotate: -5 }}
              aria-label={`${mascot.title} - ${mascot.description}`}
              role="button"
              tabIndex={0}
            >
              {/* Animated Background Glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400/20 via-cyan-400/20 to-violet-500/20"
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
              <h3 className={`font-bold text-sm md:text-base mb-1 ${
                darkMode ? 'text-white/90' : 'text-gray-900/90'
              }`}>
                {mascot.title}
              </h3>
              <p className={`text-xs md:text-sm ${
                darkMode ? 'text-white/60' : 'text-gray-600/80'
              } max-w-32 mx-auto leading-relaxed`}>
                {mascot.description}
              </p>
            </motion.div>

            {/* Hover Tooltip */}
            <motion.div
              className={`absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg z-30 ${
                darkMode 
                  ? 'bg-gray-800/90 text-white border border-gray-700/50 backdrop-blur-lg' 
                  : 'bg-white/90 text-gray-900 border border-gray-200/50 backdrop-blur-lg'
              }`}
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
              <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 ${
                darkMode ? 'bg-gray-800/90' : 'bg-white/90'
              }`} />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Expanded Details Panel */}
      {selectedMascot && (
        <motion.div
          className={`mt-12 p-6 md:p-8 rounded-2xl border-2 ${
            darkMode 
              ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700/50 backdrop-blur-lg' 
              : 'bg-gradient-to-br from-white/60 to-gray-50/60 border-gray-200/50 backdrop-blur-lg'
          } shadow-2xl`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
        >
          {(() => {
            const mascot = mascots.find(m => m.key === selectedMascot);
            return (
              <div className="text-center">
                <h3 className={`text-xl md:text-2xl font-bold mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {mascot.title}
                </h3>
                <p className={`text-base md:text-lg mb-6 ${
                  darkMode ? 'text-white/80' : 'text-gray-700'
                } max-w-2xl mx-auto`}>
                  {mascot.description}
                </p>
                <motion.button
                  className="px-6 py-3 bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 text-white font-bold rounded-full hover:shadow-xl transition-shadow duration-300"
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
