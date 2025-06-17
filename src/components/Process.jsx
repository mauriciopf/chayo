import React from "react";
import { motion } from "framer-motion";

const steps = [
	{
		title: "Consultation & Strategy",
		desc: "We learn about your business, goals, and challenges to design a custom AI automation roadmap.",
		icon: "🧑‍💼",
	},
	{
		title: "Data Collection & Training",
		desc: "We gather and prepare your data, then train AI models tailored to your unique needs.",
		icon: "📊",
	},
	{
		title: "Custom AI Development",
		desc: "We build and integrate AI agents that automate your workflows and customer interactions.",
		icon: "🤖",
	},
	{
		title: "Testing & Deployment",
		desc: "We rigorously test, deploy, and monitor your AI solutions for reliability and performance.",
		icon: "🚀",
	},
	{
		title: "Ongoing Support & Improvement",
		desc: "We provide continuous support and optimize your AI agents as your business grows.",
		icon: "🔄",
	},
];

const containerVariants = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.18,
		},
	},
};

const stepVariants = {
	hidden: { opacity: 0, y: 40, scale: 0.95 },
	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.7, type: "spring" },
	},
};

const Process = () => (
	<section
		id="process"
		className="py-12 md:py-20 bg-black text-white rounded-lg max-w-5xl mx-auto px-2 md:px-6"
	>
		<motion.h2
			className="text-3xl font-bold text-center mb-12 text-white"
			initial={{ opacity: 0, y: -30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.8 }}
		>
			Our Process
		</motion.h2>
		<motion.div
			className="flex flex-col md:flex-row md:flex-wrap gap-6 md:gap-8 justify-center items-stretch"
			variants={containerVariants}
			initial="hidden"
			whileInView="show"
			viewport={{ once: true }}
		>
			{steps.map((step, i) => (
				<motion.div
					key={step.title}
					variants={stepVariants}
					className="flex-1 min-w-[220px] bg-white/10 backdrop-blur-xl border border-orange-300/30 rounded-3xl p-7 shadow-2xl flex flex-col items-center text-center hover:scale-105 transition-all duration-300 group relative overflow-hidden"
					whileHover={{ scale: 1.08 }}
				>
					{/* Animated glowing border */}
					<span className="absolute inset-0 rounded-3xl pointer-events-none border-2 border-transparent group-hover:border-orange-400 group-hover:shadow-[0_0_32px_8px_#fb923c] transition-all duration-300" />
					{/* Floating accent spark */}
					<span className="absolute top-3 right-3 w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-300 rounded-full blur-sm opacity-80 animate-pulse" />
					<div className="text-4xl mb-3 bg-gradient-to-br from-orange-400 via-orange-300 to-yellow-200 bg-clip-text text-transparent animate-float-slow drop-shadow-lg">
						{step.icon}
					</div>
					<h3 className="text-lg font-bold mb-2 text-white drop-shadow-lg tracking-tight">
						{step.title}
					</h3>
					<p className="text-orange-100 text-base opacity-90 leading-relaxed">
						{step.desc}
					</p>
				</motion.div>
			))}
		</motion.div>
	</section>
);

export default Process;
