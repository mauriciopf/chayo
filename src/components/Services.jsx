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
	<section id="services" className="relative py-36 md:py-52 bg-transparent overflow-visible">
		<motion.div
			className="absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-40 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 opacity-20 blur-3xl rounded-full z-0 animate-pulse"
			aria-hidden="true"
			animate={{ scale: [1, 1.06, 1], rotate: [0, 8, -8, 0] }}
			transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
		/>
		<motion.h2
			className="text-5xl md:text-7xl font-extrabold text-center mb-12 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl tracking-widest uppercase"
			initial={{ opacity: 0, y: -30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.8 }}
			whileHover={{ letterSpacing: '0.18em', color: '#06b6d4', textShadow: '0 2px 32px #06b6d4' }}
		>
			Our Services
		</motion.h2>
		<p className="text-2xl text-center text-white/70 mb-20 max-w-2xl mx-auto font-light tracking-wide animate-fade-in">
			Everything you need to automate, connect, and grow—at a glance.
		</p>
		<div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-28 justify-center items-stretch">
			{services.map(({ title, icon, description }, i) => (
				<motion.div
					key={title}
					initial={{ opacity: 0, y: 40, scale: 0.96, rotate: -2 }}
					whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
					viewport={{ once: true }}
					whileHover={{ scale: 1.08, boxShadow: '0 4px 32px 0 rgba(6,182,212,0.18)', rotate: 2 }}
					animate={{ y: [0, -4, 4, 0], rotate: [0, 2, -2, 0] }}
					transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: i * 0.08 }}
					className="flex flex-col items-center text-center transition-all duration-300 group bg-gradient-to-br from-white/5 via-cyan-400/5 to-orange-400/5 shadow-xl border border-cyan-400/10 rounded-3xl p-10 md:p-14 relative overflow-visible hover:scale-105 hover:shadow-2xl hover:border-cyan-400/30"
				>
					<motion.span
						className="text-7xl md:text-8xl mb-8 drop-shadow-2xl animate-float-slow"
						whileHover={{ scale: 1.18, rotate: 8 }}
						transition={{ type: 'spring', stiffness: 300 }}
					>
						{icon}
					</motion.span>
					<motion.span
						className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase mb-4 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-xl"
						whileHover={{ letterSpacing: '0.18em', color: '#06b6d4', textShadow: '0 2px 32px #06b6d4' }}
					>
						{title}
					</motion.span>
					<motion.span
						className="text-lg md:text-xl text-white/80 max-w-xs font-light"
						whileHover={{ color: '#06b6d4' }}
					>
						{description}
					</motion.span>
					<motion.div
						className="absolute -top-8 right-8 w-8 h-8 bg-gradient-to-br from-cyan-400 to-orange-400 opacity-30 blur-2xl rounded-full z-0 animate-float"
						animate={{ scale: [1, 1.2, 1], rotate: [0, 20, -20, 0] }}
						transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
					/>
				</motion.div>
			))}
		</div>
	</section>
);

export default Services;
