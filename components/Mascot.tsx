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
				width="120"
				height="120"
				viewBox="0 0 120 120"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Robot head with gradient */}
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
				{/* Animated eyes */}
				<circle cx="45" cy="55" r="8" fill={CYAN}>
					<animate attributeName="r" values="8;6;8" dur="2s" repeatCount="indefinite" />
				</circle>
				<circle cx="75" cy="55" r="8" fill={CYAN}>
					<animate attributeName="r" values="8;6;8" dur="2s" repeatCount="indefinite" begin="0.5s" />
				</circle>
				{/* Animated smile */}
				<path
					d="M45 75 Q60 90 75 75"
					stroke={CYAN}
					strokeWidth="4"
					fill="none"
					strokeLinecap="round"
					filter="url(#glow)"
				/>
				{/* Antenna with pulsing light */}
				<rect x="58" y="15" width="4" height="15" rx="2" fill={ORANGE} />
				<circle cx="60" cy="13" r="4" fill={CYAN}>
					<animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
				</circle>
			</svg>
		),
		animate: { y: [0, -20, 0] },
		transition: {
			duration: 2,
			repeat: Infinity,
			repeatType: "loop",
			delay: 0,
		},
	},
	{
		key: "chat",
		title: "Smart Chatbots",
		description: "Natural conversation AI",
		svg: (
			<svg
				width="120"
				height="120"
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
				{/* Main chat bubble */}
				<ellipse
					cx="60"
					cy="60"
					rx="40"
					ry="30"
					fill="url(#chatGradient)"
					opacity="0.9"
				/>
				{/* Chat tail */}
				<path
					d="M40 80 L30 95 L50 85 Z"
					fill="url(#chatGradient)"
					opacity="0.9"
				/>
				{/* Animated typing dots */}
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
		animate: { scale: [1, 1.15, 1] },
		transition: {
			duration: 2.2,
			repeat: Infinity,
			repeatType: "loop",
			delay: 0.3,
		},
	},
	{
		key: "analytics",
		title: "Data Analytics",
		description: "Intelligent insights & reporting",
		svg: (
			<svg
				width="120"
				height="120"
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
				{/* Animated bar chart */}
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
				{/* Trending arrow */}
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
		animate: { rotate: [0, 10, -10, 0] },
		transition: {
			duration: 2.5,
			repeat: Infinity,
			repeatType: "loop",
			delay: 0.6,
		},
	},
	{
		key: "integration",
		title: "System Integration",
		description: "Seamless workflow automation",
		svg: (
			<svg
				width="120"
				height="120"
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
				{/* Connection nodes */}
				<circle cx="30" cy="40" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="90" cy="40" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="30" cy="80" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="90" cy="80" r="12" fill="url(#integrationGradient)" opacity="0.9" />
				<circle cx="60" cy="60" r="15" fill="url(#integrationGradient)" />
				
				{/* Animated connection lines */}
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
				
				{/* Central hub icon */}
				<circle cx="60" cy="60" r="6" fill="#fff" opacity="0.9" />
			</svg>
		),
		animate: { x: [0, 15, -15, 0] },
		transition: {
			duration: 2.8,
			repeat: Infinity,
			repeatType: "loop",
			delay: 0.9,
		},
	},
];

// Sound effect helper (optional - only if audio files are available)
const playHoverSound = () => {
	// Uncomment if you want to add sound effects
	// const audio = new Audio('/sounds/hover.mp3');
	// audio.volume = 0.1;
	// audio.play().catch(() => {}); // Ignore errors if sound not available
};

// Floating particle component for enhanced visual appeal
const FloatingParticle = ({ delay, darkMode }) => (
	<motion.div
		className={`absolute w-1 h-1 rounded-full ${
			darkMode ? 'bg-cyan-400' : 'bg-orange-400'
		} opacity-60`}
		style={{
			left: `${Math.random() * 100}%`,
			top: `${Math.random() * 100}%`,
		}}
		animate={{
			y: [0, -100, 0],
			x: [0, Math.random() * 50 - 25, 0],
			opacity: [0, 0.8, 0],
		}}
		transition={{
			duration: 6 + Math.random() * 4,
			repeat: Infinity,
			delay: delay,
			ease: "easeInOut",
		}}
	/>
);

const Mascot = ({ darkMode }) => {
	const [hoveredMascot, setHoveredMascot] = useState(null);
	const [selectedMascot, setSelectedMascot] = useState(null);

	return (
		<section className={`relative py-16 md:py-24 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300 overflow-hidden`}>
			{/* Floating Background Particles */}
			{[...Array(12)].map((_, i) => (
				<FloatingParticle key={i} delay={i * 0.5} darkMode={darkMode} />
			))}
			
			{/* Background Gradient Effects */}
			<motion.div
				className="absolute inset-0 bg-gradient-to-r from-orange-400/5 via-cyan-400/5 to-violet-500/5 opacity-50"
				animate={{
					backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
				}}
				transition={{
					duration: 20,
					repeat: Infinity,
					ease: "linear",
				}}
			/>
			
			<div className="relative z-10 max-w-6xl mx-auto px-4">
				{/* Section Header */}
				<motion.div 
					className="text-center mb-16"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					<h2 className={`text-3xl md:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
						<span className="bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
							AI Solutions
						</span>{' '}
						<span className={darkMode ? 'text-white' : 'text-gray-900'}>That Work</span>
					</h2>
					<p className={`text-lg md:text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
						Discover how our AI technologies transform businesses across industries
					</p>
				</motion.div>

				{/* Interactive Mascot Grid */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
					{mascots.map((mascot, index) => (
						<motion.div
							key={mascot.key}
							className="relative group"
							initial={{ opacity: 0, y: 40 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: index * 0.2 }}
							onHoverStart={() => {
								setHoveredMascot(mascot.key);
								playHoverSound(); // Play sound on hover
							}}
							onHoverEnd={() => setHoveredMascot(null)}
							onClick={() => setSelectedMascot(selectedMascot === mascot.key ? null : mascot.key)}
						>
							{/* Mascot Icon Container */}
							<motion.div
								className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center shadow-xl border-2 cursor-pointer transition-all duration-300 mx-auto ${
									darkMode 
										? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
										: 'bg-gradient-to-br from-white to-gray-100 border-gray-200'
								} ${hoveredMascot === mascot.key ? 'shadow-2xl scale-110' : ''} ${
									selectedMascot === mascot.key ? 'ring-4 ring-cyan-400 ring-opacity-50' : ''
								}`}
								animate={mascot.animate}
								transition={mascot.transition}
								whileHover={{ 
									scale: 1.15, 
									rotate: 5,
									boxShadow: darkMode 
										? "0 20px 40px rgba(6, 182, 212, 0.3)" 
										: "0 20px 40px rgba(6, 182, 212, 0.2)"
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
										opacity: hoveredMascot === mascot.key ? 0.6 : 0,
										scale: hoveredMascot === mascot.key ? 1.05 : 1,
									}}
									transition={{ duration: 0.3 }}
								/>
								
								{/* SVG Icon */}
								<div className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20">
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
									darkMode ? 'text-white' : 'text-gray-900'
								}`}>
									{mascot.title}
								</h3>
								<p className={`text-xs md:text-sm ${
									darkMode ? 'text-gray-400' : 'text-gray-600'
								} max-w-32 mx-auto leading-relaxed`}>
									{mascot.description}
								</p>
							</motion.div>

							{/* Hover Tooltip */}
							<motion.div
								className={`absolute -top-16 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg z-20 ${
									darkMode 
										? 'bg-gray-800 text-white border border-gray-700' 
										: 'bg-white text-gray-900 border border-gray-200'
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
									darkMode ? 'bg-gray-800' : 'bg-white'
								}`} />
							</motion.div>
						</motion.div>
					))}
				</div>

				{/* Expanded Details Panel */}
				{selectedMascot && (
					<motion.div
						className={`mt-12 p-8 rounded-2xl border-2 ${
							darkMode 
								? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
								: 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
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
									<h3 className={`text-2xl md:text-3xl font-bold mb-4 ${
										darkMode ? 'text-white' : 'text-gray-900'
									}`}>
										{mascot.title}
									</h3>
									<p className={`text-lg mb-6 ${
										darkMode ? 'text-gray-300' : 'text-gray-600'
									} max-w-3xl mx-auto`}>
										{mascot.description}
									</p>
									<motion.button
										className="px-8 py-3 bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-500 text-white font-bold rounded-full hover:shadow-xl transition-shadow duration-300"
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
			</div>

			{/* Floating Particles Background Effect */}
			<div className="absolute inset-0 pointer-events-none">
				<FloatingParticle delay={0} darkMode={darkMode} />
				<FloatingParticle delay={1.5} darkMode={darkMode} />
				<FloatingParticle delay={3} darkMode={darkMode} />
				<FloatingParticle delay={4.5} darkMode={darkMode} />
			</div>
		</section>
	);
};

export default React.memo(Mascot);
