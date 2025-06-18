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
		<section id="industry-process" className="relative py-56 md:py-[18rem] bg-transparent max-w-7xl mx-auto px-2 md:px-8 overflow-visible">
			{/* Dramatic animated background: layered gradients, glassy overlays, floating lines, and accent dots */}
			<motion.div
				className="absolute inset-0 w-full h-full pointer-events-none z-0"
				aria-hidden="true"
			>
				<motion.div
					className="absolute left-1/2 top-0 -translate-x-1/2 w-[70vw] h-64 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 opacity-30 blur-3xl rounded-full animate-float-slow"
					animate={{ scale: [1, 1.12, 1], rotate: [0, 16, -16, 0] }}
					transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
				/>
				<motion.div
					className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-24 bg-gradient-to-r from-white/40 via-cyan-400/20 to-orange-400/20 opacity-20 blur-lg rounded-full z-0 pointer-events-none"
					animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.04, 1] }}
					transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
				/>
				{/* Floating accent dots */}
				{[...Array(5)].map((_, i) => (
					<motion.span
						key={i}
						className="absolute rounded-full blur-2xl"
						style={{
							width: 18 + i * 4,
							height: 18 + i * 4,
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
				className="text-5xl md:text-7xl font-extrabold text-center mb-20 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl tracking-widest uppercase"
				initial={{ opacity: 0, y: -40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 1 }}
				whileHover={{ letterSpacing: '0.22em', color: '#06b6d4', textShadow: '0 2px 32px #06b6d4' }}
			>
				How Agentic AI Works for Your Industry
			</motion.h2>
			<motion.p className="text-2xl text-center text-white/80 mb-24 max-w-3xl mx-auto font-light tracking-wide animate-fade-in"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 1, delay: 0.2 }}
			>
				From tailored solutions to seamless deployment—see how we deliver AI-powered transformation for every business.
			</motion.p>
			{/* Innovative timeline for process steps */}
			<motion.div
				className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-16 md:gap-0 mb-24"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 1 }}
			>
				<div className="hidden md:block absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-cyan-400 via-white/30 to-orange-400 opacity-40 blur-md -z-10" />
				{steps.map(({ title, icon, tagline }, i) => (
					<motion.div
						key={title}
						whileHover={{ scale: 1.15, rotate: i % 2 === 0 ? 6 : -6, boxShadow: '0 8px 48px 0 rgba(6,182,212,0.18)' }}
						className="flex flex-col items-center text-center transition-all duration-300 group bg-transparent p-0 relative"
						style={{ zIndex: 2 }}
					>
						<motion.div
							className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-400 via-white/10 to-orange-400 shadow-xl mb-6 border-4 border-white/10"
							animate={{ scale: [1, 1.08, 1], boxShadow: [
								'0 0 0 0 rgba(6,182,212,0.12)',
								'0 0 32px 8px rgba(6,182,212,0.18)',
								'0 0 0 0 rgba(6,182,212,0.12)'
							] }}
							transition={{ duration: 6, repeat: Infinity }}
						>
							<span className="text-4xl md:text-5xl drop-shadow-xl animate-float-slow">{icon}</span>
						</motion.div>
						<span className="text-lg md:text-xl font-black text-white tracking-widest uppercase mb-2 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-xl">
							{title}
						</span>
						<span className="text-base md:text-lg text-white/70 max-w-xs font-light">
							{tagline}
						</span>
					</motion.div>
				))}
			</motion.div>
			{/* Animated floating industry badges below timeline */}
			<motion.div
				className="relative z-10 max-w-5xl mx-auto flex flex-wrap justify-center gap-10 md:gap-16 mt-8"
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
						className="flex flex-col items-center text-center transition-all duration-300 group bg-gradient-to-br from-white/5 via-cyan-400/5 to-orange-400/5 shadow-xl border border-cyan-400/10 rounded-full px-8 py-6 md:px-10 md:py-8 relative overflow-visible hover:scale-105 hover:shadow-2xl hover:border-cyan-400/30"
					>
						<span className="text-3xl md:text-4xl mb-2 drop-shadow-xl animate-float-slow">{icon}</span>
						<span className="text-base md:text-lg font-bold text-white tracking-widest uppercase mb-1 bg-gradient-to-r from-cyan-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-xl">
							{title}
						</span>
						<span className="text-xs md:text-base text-white/70 max-w-xs font-light">
							{tagline}
						</span>
					</motion.div>
				))}
			</motion.div>
		</section>
	);
}
