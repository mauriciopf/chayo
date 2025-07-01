import React from "react";
import { motion } from "framer-motion";

const steps = [
	{ title: "Consultation", icon: "🧑‍💼" },
	{ title: "Data & Training", icon: "📊" },
	{ title: "AI Build", icon: "🤖" },
	{ title: "Deploy", icon: "🚀" },
	{ title: "Support", icon: "🔄" },
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
		className="relative py-32 bg-transparent max-w-5xl mx-auto px-2 md:px-6"
	>
		{/* Floating blurred accent shape */}
		<motion.div
			className="absolute -top-16 left-1/2 -translate-x-1/2 w-[32rem] h-32 bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-300 opacity-20 blur-3xl rounded-full z-0 animate-pulse"
			aria-hidden="true"
		/>
		<motion.h2
			className="text-3xl md:text-4xl font-light text-center mb-8 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent"
			initial={{ opacity: 0, y: -30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.8 }}
		>
			Our Process
		</motion.h2>
		<p className="text-lg text-center text-gray-600 mb-16 max-w-2xl mx-auto">
			From strategy to support, our streamlined process gets you AI-powered fast.
		</p>
		<motion.div
			className="relative z-10 max-w-4xl mx-auto flex flex-wrap justify-center gap-16"
			variants={containerVariants}
			initial="hidden"
			whileInView="show"
			viewport={{ once: true }}
		>
			{steps.map(({ title, icon }, i) => (
				<motion.div
					key={title}
					variants={stepVariants}
					whileHover={{ scale: 1.12 }}
					className="flex flex-col items-center text-center transition-all duration-300 group bg-transparent shadow-none border-none rounded-none p-0 relative"
				>
					<span className="text-5xl md:text-6xl mb-4 drop-shadow-xl animate-float-slow">
						{icon}
					</span>
					<span className="text-lg md:text-xl font-bold text-gray-900 tracking-wide uppercase">
						{title}
					</span>
				</motion.div>
			))}
		</motion.div>
	</section>
);

export default Process;
