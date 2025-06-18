import React from "react";
import { motion } from "framer-motion";

const services = [
	{
		title: "AI Automation Agents",
		icon: "🤖",
		description: "Custom AI agents for support, sales, and operations.",
	},
	{
		title: "Omnichannel Messaging",
		icon: "💬",
		description: "Automate conversations across Instagram, WhatsApp, SMS, and more.",
	},
	{
		title: "Data Insights & Analytics",
		icon: "📊",
		description: "Unlock actionable insights and automate reporting.",
	},
	{
		title: "Custom Integrations",
		icon: "🔗",
		description: "Seamlessly connect AI with your existing tools and workflows.",
	},
];

const Services = () => (
	<section id="services" className="relative py-20 xs:py-28 sm:py-44 md:py-60 bg-transparent overflow-visible">
		{/* Layered animated gradients and glassy overlays for services */}
		<motion.div
			className="absolute -top-24 xs:-top-32 left-1/2 -translate-x-1/2 w-[90vw] sm:w-[60vw] h-20 sm:h-40 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 opacity-30 blur-3xl rounded-full z-0 animate-pulse"
			aria-hidden="true"
			animate={{ scale: [1, 1.06, 1], rotate: [0, 8, -8, 0] }}
			transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
		/>
		<motion.div
			className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] sm:w-[40vw] h-8 sm:h-16 bg-gradient-to-r from-white/40 via-cyan-400/20 to-orange-400/20 opacity-20 blur-lg rounded-full z-0 pointer-events-none"
			animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.04, 1] }}
			transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
		/>
		{/* Subtle floating accent dots */}
		{[...Array(4)].map((_, i) => (
			<motion.span
				key={i}
				className={`absolute rounded-full blur-2xl ${i > 1 ? 'hidden xs:block' : ''}`}
				style={{
					width: 12 + i * 4,
					height: 12 + i * 4,
					background: i % 2 === 0 ? '#E87811' : '#06b6d4',
					top: `${40 + i * 8}%`,
					left: `${10 + i * 20}%`,
					opacity: 0.3 + (i % 2) * 0.1,
					zIndex: 1,
				}}
				animate={{ y: [0, -8, 8, 0] }}
				transition={{ duration: 7 + i, repeat: Infinity, repeatType: 'mirror', delay: i * 0.2 }}
			/>
		))}
		<motion.h2
			className="text-3xl xs:text-4xl sm:text-6xl md:text-8xl font-black text-center mb-8 sm:mb-16 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_4px_64px_rgba(6,182,212,0.25)] tracking-widest uppercase"
			initial={{ opacity: 0, y: -30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.8 }}
			whileHover={{ letterSpacing: '0.22em', color: '#06b6d4', textShadow: '0 2px 32px #06b6d4' }}
		>
			Our Services
		</motion.h2>
		<p className="text-lg xs:text-xl sm:text-2xl md:text-3xl text-center text-white/70 mb-10 sm:mb-24 max-w-xl sm:max-w-3xl mx-auto font-light tracking-wide animate-fade-in">
			Everything you need to automate, connect, and grow—at a glance.
		</p>
		<div className="relative z-10 max-w-xl xs:max-w-2xl sm:max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 xs:gap-16 sm:gap-24 md:gap-32 justify-center items-stretch">
			{services.map(({ title, icon, description }, i) => (
				<motion.div
					key={title}
					initial={{ opacity: 0, y: 40, scale: 0.96, rotate: -2 }}
					whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
					viewport={{ once: true }}
					whileHover={{ scale: 1.13, boxShadow: '0 8px 48px 0 rgba(6,182,212,0.18)', rotate: 2 }}
					animate={{ y: [0, -8, 8, 0], rotate: [0, 2, -2, 0] }}
					transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: i * 0.08 }}
					className="flex flex-col items-center text-center transition-all duration-300 group bg-gradient-to-br from-white/10 via-cyan-400/10 to-orange-400/10 shadow-2xl border border-cyan-400/20 rounded-3xl p-6 xs:p-10 sm:p-14 md:p-20 relative overflow-visible hover:scale-110 hover:shadow-2xl hover:border-cyan-400/40"
				>
					<motion.span
						className="text-5xl xs:text-7xl md:text-9xl mb-6 xs:mb-10 drop-shadow-2xl animate-float-slow"
						whileHover={{ scale: 1.22, rotate: 8 }}
						transition={{ type: 'spring', stiffness: 300 }}
					>
						{icon}
					</motion.span>
					<motion.span
						className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-widest uppercase mb-2 xs:mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-xl"
						whileHover={{ letterSpacing: '0.22em', color: '#06b6d4', textShadow: '0 2px 32px #06b6d4' }}
					>
						{title}
					</motion.span>
					<motion.span
						className="text-base xs:text-lg sm:text-xl md:text-2xl text-white/80 max-w-xs font-light"
						whileHover={{ color: '#06b6d4' }}
					>
						{description}
					</motion.span>
					<motion.div
						className="absolute -top-6 xs:-top-10 right-6 xs:right-10 w-8 xs:w-12 h-8 xs:h-12 bg-gradient-to-br from-cyan-400 to-orange-400 opacity-30 blur-2xl rounded-full z-0 animate-float"
						animate={{ scale: [1, 1.2, 1], rotate: [0, 20, -20, 0] }}
						transition={{ duration: 5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
					/>
				</motion.div>
			))}
		</div>
	</section>
);

export default Services;
