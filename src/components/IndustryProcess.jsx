import React from "react";
import { motion } from "framer-motion";

const industries = [
	{ title: "Customer AI", icon: "💬", tagline: "Instant support, always on." },
	{ title: "Analytics", icon: "🔮", tagline: "Smarter decisions, faster." },
	{ title: "Marketing", icon: "📈", tagline: "Automated, targeted growth." },
	{ title: "Voice & Messaging", icon: "📞", tagline: "Omnichannel, seamless." },
	{ title: "Booking", icon: "🛒", tagline: "Frictionless scheduling." },
	{ title: "Integrations", icon: "🔗", tagline: "Connect everything." },
];

const steps = [
	{ title: "Consultation", icon: "🧑‍💼", tagline: "We listen, strategize, and plan." },
	{ title: "Data & Training", icon: "📊", tagline: "Your data, our expertise." },
	{ title: "AI Build", icon: "🤖", tagline: "Custom AI, built for you." },
	{ title: "Deploy", icon: "🚀", tagline: "Go live, instantly." },
	{ title: "Support", icon: "🔄", tagline: "Continuous improvement." },
];

const containerVariants = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.15,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 40, scale: 0.95 },
	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.7, type: "spring" },
	},
};

export default function IndustryProcess() {
	return (
		<section id="industry-process" className="relative py-16 xs:py-24 sm:py-44 md:py-[18rem] bg-transparent max-w-7xl mx-auto px-2 xs:px-4 md:px-8 overflow-visible">
			{/* Dramatic animated background: layered gradients, glassy overlays, floating lines, and accent dots */}
			<motion.div
				className="absolute inset-0 w-full h-full pointer-events-none z-0"
				aria-hidden="true"
			>
				<motion.div
					className="absolute left-1/2 top-0 -translate-x-1/2 w-[90vw] sm:w-[70vw] h-32 sm:h-64 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 opacity-30 blur-3xl rounded-full animate-float-slow"
					animate={{ scale: [1, 1.12, 1], rotate: [0, 16, -16, 0] }}
					transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
				/>
				<motion.div
					className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] sm:w-[50vw] h-12 sm:h-24 bg-gradient-to-r from-white/40 via-cyan-400/20 to-orange-400/20 opacity-20 blur-lg rounded-full z-0 pointer-events-none"
					animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.04, 1] }}
					transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
				/>
				{/* Floating accent dots */}
				{[...Array(5)].map((_, i) => (
					<motion.span
						key={i}
						className={`absolute rounded-full blur-2xl ${i > 2 ? 'hidden xs:block' : ''}`}
						style={{
							width: 12 + i * 4,
							height: 12 + i * 4,
							background: i % 2 === 0 ? '#E87811' : '#06b6d4',
							top: `${30 + i * 10}%`,
							left: `${10 + i * 18}%`,
							opacity: 0.3 + (i % 2) * 0.1,
							zIndex: 1,
						}}
						animate={{ y: [0, -10, 10, 0] }}
						transition={{ duration: 8 + i, repeat: Infinity, repeatType: 'mirror', delay: i * 0.2 }}
					/>
				))}
			</motion.div>
			<motion.h2
				className="text-2xl xs:text-3xl sm:text-5xl md:text-7xl font-extrabold text-center mb-8 sm:mb-20 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl tracking-widest uppercase"
				initial={{ opacity: 0, y: -40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 1 }}
			>
				How Agentic AI Works for Your Industry
			</motion.h2>
			<motion.p className="text-base xs:text-lg sm:text-2xl text-center text-white/80 mb-8 sm:mb-24 max-w-lg sm:max-w-3xl mx-auto font-light tracking-wide animate-fade-in"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 1, delay: 0.2 }}
			>
				From tailored solutions to seamless deployment—see how we deliver AI-powered transformation for every business.
			</motion.p>
			{/* Timeline for process steps - vertical on mobile, horizontal on desktop */}
			<motion.div
				className="relative z-10 max-w-xl xs:max-w-2xl sm:max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 md:gap-0 mb-10 sm:mb-24"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 1 }}
			>
				<div className="block sm:hidden absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-white/30 to-orange-400 opacity-40 blur-md -z-10" />
				<div className="hidden sm:block absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-cyan-400 via-white/30 to-orange-400 opacity-40 blur-md -z-10" />
				{steps.map(({ title, icon, tagline }, i) => (
					<motion.div
						key={title}
						whileHover={{ scale: 1.15, rotate: i % 2 === 0 ? 6 : -6, boxShadow: '0 8px 48px 0 rgba(6,182,212,0.18)' }}
						className="flex flex-col items-center text-center transition-all duration-300 group bg-transparent p-0 relative"
						style={{ zIndex: 2 }}
					>
						<motion.div
							className="flex items-center justify-center w-14 h-14 xs:w-20 xs:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-400 via-white/10 to-orange-400 shadow-xl mb-3 xs:mb-6 border-4 border-white/10"
							animate={{ scale: [1, 1.08, 1], boxShadow: [
								'0 0 0 0 rgba(6,182,212,0.12)',
								'0 0 32px 8px rgba(6,182,212,0.18)',
								'0 0 0 0 rgba(6,182,212,0.12)'
							] }}
							transition={{ duration: 6, repeat: Infinity }}
						>
							<span className="text-2xl xs:text-4xl md:text-5xl drop-shadow-xl animate-float-slow">{icon}</span>
						</motion.div>
						<span className="text-base xs:text-lg md:text-xl font-black text-white tracking-widest uppercase mb-1 xs:mb-2 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-xl">
							{title}
						</span>
						<span className="text-xs xs:text-base md:text-lg text-white/70 max-w-xs font-light">
							{tagline}
						</span>
					</motion.div>
				))}
			</motion.div>
			{/* Animated floating industry badges below timeline - grid adjusts for mobile */}
			<motion.div
				className="relative z-10 max-w-xl xs:max-w-2xl sm:max-w-5xl mx-auto grid grid-cols-1 xs:grid-cols-2 sm:flex flex-wrap justify-center gap-6 xs:gap-10 md:gap-16 mt-4 sm:mt-8"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 1 }}
			>
				{industries.map(({ title, icon, tagline }, i) => (
					<motion.div
						key={title}
						whileHover={{ scale: 1.13, rotate: i % 2 === 0 ? -8 : 8, boxShadow: '0 8px 48px 0 rgba(6,182,212,0.18)' }}
						animate={{ y: [0, -8, 8, 0] }}
						transition={{ duration: 7 + i, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
						className="flex flex-col items-center text-center transition-all duration-300 group bg-gradient-to-br from-white/5 via-cyan-400/5 to-orange-400/5 shadow-xl border border-cyan-400/10 rounded-full px-6 xs:px-8 md:px-10 py-4 xs:py-6 md:py-8 relative overflow-visible hover:scale-105 hover:shadow-2xl hover:border-cyan-400/30"
					>
						<span className="text-xl xs:text-3xl md:text-4xl mb-1 xs:mb-2 drop-shadow-xl animate-float-slow">{icon}</span>
						<span className="text-xs xs:text-base md:text-lg font-bold text-white tracking-widest uppercase mb-0.5 xs:mb-1 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-xl">
							{title}
						</span>
						<span className="text-[10px] xs:text-xs md:text-base text-white/70 max-w-xs font-light">
							{tagline}
						</span>
					</motion.div>
				))}
			</motion.div>
		</section>
	);
}
